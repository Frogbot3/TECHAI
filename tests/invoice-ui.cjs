// Requires the local dev server with the synthetic JWT_SECRET documented below.
// Every /api request is intercepted. Order creation/payment/mail are forbidden.
const fs = require("node:fs"),
  assert = require("node:assert/strict"),
  jwt = require("jsonwebtoken");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const load = require("./load-ts.cjs")(),
  { settings, productTax, address } = require("./invoice-fixtures.cjs");
const { calculateTaxOrder } = load("src/lib/tax.ts");
const { createHash } = require("node:crypto");
const fixtures = require("./invoice-fixtures.cjs");
const sampleOrder = fixtures.order(
  calculateTaxOrder(
    settings(),
    [fixtures.line()],
    address,
    { kind: "consumer" },
    0,
    0,
  ),
  "SAMPLE-ORDER-1",
);
sampleOrder.items[0].product.image = "/brand/techai-logo.png";
const product = {
  id: "sample-ui",
  sku: "SAMPLE-UI",
  title: "SAMPLE Tax Test Product",
  brand: "TECH AI",
  category: "Electronics",
  price: 118,
  originalPrice: 118,
  stock: 10,
  image: "/brand/techai-logo.png",
  images: ["/brand/techai-logo.png"],
  features: [],
  specs: {},
  description: "Synthetic product for local UI testing",
  tax: productTax(),
  rating: 4,
  reviewCount: 0,
};
const recipient = { ...address, phone: "9876543210" };
const user = {
  id: "sample-customer",
  name: "Sample Recipient",
  phone: recipient.phone,
  email: "",
  addresses: [recipient],
  role: "customer",
};
async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const errors = [],
    unexpected = [],
    saved = [];
  let quoteCalls = 0;
  page.on("pageerror", (e) => errors.push(e.message));
  await context.addCookies([
    {
      name: "techai_admin_session",
      value: jwt.sign(
        { id: "SAMPLE-ADMIN", role: "admin" },
        "synthetic-local-invoice-browser-check-only-2026",
        { expiresIn: "1h" },
      ),
      url: "http://localhost:3000",
    },
  ]);
  await page.route("**/api/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    let data = { success: true };
    if (url.pathname === "/api/admin/business-settings") {
      if (request.method() === "PUT") {
        const body = request.postDataJSON();
        saved.push(body);
        data = { settings: body };
      } else
        data = {
          settings: settings(),
          review: [
            {
              id: "missing",
              title: "SAMPLE Unconfigured Product",
              reason: "Tax setup required.",
            },
          ],
        };
    } else if (url.pathname === "/api/admin/session")
      data = { success: true, user: { id: "SAMPLE-ADMIN", role: "admin" } };
    else if (url.pathname === "/api/admin/stats")
      data = {
        success: true,
        stats: {
          totalRevenue: 0,
          totalOrders: 0,
          totalProducts: 1,
          totalCustomers: 0,
          lowStockCount: 0,
        },
        products: [product],
        orders: [],
        customers: [],
      };
    else if (url.pathname === "/api/products")
      data = { success: true, products: [product] };
    else if (url.pathname === "/api/auth/session")
      data = { success: true, user };
    else if (url.pathname === "/api/hero-campaigns")
      data = { success: true, campaigns: [] };
    else if (url.pathname === "/api/orders" && request.method() === "GET")
      data = { success: true, orders: [sampleOrder] };
    else if (url.pathname === "/api/refunds")
      data = { success: true, refunds: [] };
    else if (url.pathname === "/api/orders/SAMPLE-ORDER-1/invoice")
      return route.fulfill({
        status: 200,
        contentType: "application/pdf",
        headers: { "X-Invoice-State": "issued" },
        body: fs.readFileSync("output/pdf/sample-mixed-intrastate.pdf"),
      });
    else if (url.pathname === "/api/wishlist")
      data = { success: true, wishlist: [] };
    else if (url.pathname === "/api/checkout/quote") {
      quoteCalls++;
      const body = request.postDataJSON();
      try {
        const tax = calculateTaxOrder(
          settings(),
          body.items.map((i) => ({
            productId: product.id,
            sku: product.sku,
            description: product.title,
            price: product.price,
            quantity: i.quantity,
            tax: product.tax,
          })),
          body.shippingAddress,
          body.buyerTax,
          0,
          49,
        );
        data = {
          tax,
          hash: createHash("sha256").update(JSON.stringify(tax)).digest("hex"),
        };
      } catch (e) {
        return route.fulfill({
          status: 422,
          contentType: "application/json",
          body: JSON.stringify({ message: e.message }),
        });
      }
    } else {
      unexpected.push(request.method() + " " + url.pathname);
      return route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ message: "Forbidden in synthetic UI test" }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  const output = "output/invoice-ui";
  fs.mkdirSync(output, { recursive: true });
  try {
    await page.goto("http://localhost:3000/admin/dashboard?tab=business", {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page
      .getByRole("heading", {
        name: "Business / Invoice Settings",
        exact: true,
      })
      .last()
      .waitFor();
    assert.equal(
      await page.getByLabel("GSTIN", { exact: true }).inputValue(),
      "32AFVFS6088Q1ZR",
    );
    await page
      .getByLabel("Approved GST rates (comma-separated)")
      .fill("5, 12, 18, 28");
    await page
      .getByRole("button", { name: "Save business settings", exact: true })
      .click();
    await page
      .getByText("Settings saved. Issued invoices remain unchanged.")
      .waitFor();
    assert.deepEqual(saved[0].approvedRates, [5, 12, 18, 28]);
    await page.screenshot({
      path: output + "/business-settings.png",
      fullPage: true,
    });
    await page.goto("http://localhost:3000/admin/dashboard?tab=products", {
      waitUntil: "domcontentloaded",
    });
    await page.getByTitle("Edit Product & Hero Offers").first().click();
    await page.getByRole("heading", { name: "Tax", exact: true }).waitFor();
    assert.equal(
      await page.getByLabel("HSN code", { exact: true }).inputValue(),
      "8471",
    );
    await page.getByLabel(/Selling price basis/).selectOption("exclusive");
    await page.getByText(/customer price ₹139.24/).waitFor();
    await page
      .getByRole("heading", { name: "Tax", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: output + "/product-tax-preview.png" });
    await page.addInitScript(
      ({ product, user }) => {
        localStorage.setItem(
          "techai_cart_v2",
          JSON.stringify([{ product, quantity: 1 }]),
        );
        localStorage.setItem("techai_user_v2", JSON.stringify(user));
      },
      { product, user },
    );
    await page.goto("http://localhost:3000/cart", {
      waitUntil: "domcontentloaded",
    });
    await page.getByRole("button", { name: /Proceed to Checkout/i }).click();
    await page.getByText("Payable total", { exact: true }).waitFor();
    await page.getByText("Price breakdown", { exact: true }).click();
    await page
      .getByText("Items after discounts, including GST", { exact: true })
      .waitFor();
    await page.screenshot({ path: output + "/checkout-desktop.png" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: output + "/checkout-mobile.png" });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
      false,
    );
    await page
      .getByRole("button", { name: "Continue to payment", exact: true })
      .click();
    await page.getByText("GST included above", { exact: true }).waitFor();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("http://localhost:3000/orders", {
      waitUntil: "domcontentloaded",
    });
    const invoiceButton = page
      .getByRole("button", { name: "View invoice", exact: true })
      .first();
    await invoiceButton.click();
    await page
      .getByRole("heading", { name: "Invoice (issued)", exact: true })
      .waitFor();
    await page.getByTitle("Authoritative invoice PDF").waitFor();
    assert.equal(await page.locator("dialog[open]").count(), 1);
    await page.screenshot({ path: output + "/customer-invoice-preview.png" });
    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download PDF", exact: true })
      .click();
    const download = await downloadPromise;
    assert.match(download.suggestedFilename(), /\.pdf$/);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("dialog[open]").count(), 0);
    assert.ok(quoteCalls > 0);
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpected, []);
    fs.writeFileSync(
      output + "/verification.json",
      JSON.stringify(
        {
          settingsSavedToMock: true,
          productPreview: true,
          checkoutQuote: true,
          mobileNoOverflow: true,
          paymentNotSubmitted: true,
          invoicePreviewAndDownload: true,
          invoiceEscapeDismissal: true,
          quoteCalls,
          errors,
          unexpected,
        },
        null,
        2,
      ),
    );
    console.log("Invoice UI checks passed");
  } catch (error) {
    await page.screenshot({ path: output + "/failure.png", fullPage: true });
    console.error(
      "Browser page errors:",
      errors,
      "Unexpected requests:",
      unexpected,
    );
    throw error;
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
