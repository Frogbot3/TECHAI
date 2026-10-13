# TECH AI invoice and tax rollout

Implemented locally; no production database migration, orders, payments, customer emails, push or deployment was performed.

## Seller evidence and branding

The supplied certificate image matches the legal name **SUPPLYCO PACKAGING AND INDUSTRIAL TECHNOLOGY**, GSTIN **32AFVFS6088Q1ZR**, building **16/621**, **Trithala Padinjarangadi Road**, **Thrithala**, **Palakkad**, **Kerala 679552**. State code **32** agrees with the GSTIN prefix. Country is India. The image does not establish current registration status. Its trade-name field is blank; TECH AI is used as project branding, not represented as a verified registered trade name.

The raster invoice logo is a capture of the repository's existing `TechAiLogo` component, retaining its aspect ratio. Noto Sans is embedded for the rupee glyph; its OFL license is in `public/fonts/OFL.txt`. Optional phone/email fields remain empty. No bank details, signature image, CIN, warranty or return terms were invented.

## Before enabling production

1. Open **Admin → Business / Invoice Settings**. Confirm current seller registration, address and any actual contact details. Save the supplied identity only after review.
2. Confirm whether existing selling prices include or exclude GST. This is a required acknowledgement, not a bulk price conversion. Each product must separately have its correct price basis, approved rate, HSN, unit, treatment and explicit cess/reverse-charge review. Existing price numbers remain unchanged. Download the tax-setup review list and resolve affected products. Missing configurations block new checkout; no rate is inferred from product names or categories.
3. Enter approved rate options. Enabling custom rates authorizes administrators to enter validated rates; it does not classify products automatically. Review correct HSN length for turnover and applicable notifications.
4. Approve the before-supply coupon policy and shipping classification. Existing shipping thresholds remain unchanged: ₹49 through ₹499 of listed item prices; free above ₹499. Explicitly select whether that charge includes GST. Incidental freight is allocated by discounted GST-inclusive goods values, using each associated goods line's rate. This option requires a justified composite/incidental supply classification. A separately classified shipping supply requires its own HSN/SAC and rate. Neither policy is a universal legal conclusion for all businesses.
5. Confirm rounding, signature treatment and e-invoice applicability. Wet-signature mode requires signing the printed document before supply. Electronic-policy mode is an explicit business confirmation of the applicable legal exception; this implementation does not apply a cryptographic signature. Required B2B e-invoicing blocks checkout until a real IRP integration is implemented. Assess any separate B2C dynamic-payment-QR obligations; the delivery QR does not satisfy them.
6. Audit the established invoice series and previously issued documents. Choose the approved prefix and next available starting number for a new series. The original application did not persist issued PDFs or an atomic invoice series. Previously downloaded documents are not imported or renumbered. Do not reuse a historical number. The implemented format is a 1–3 character prefix, financial year and six-digit sequence, maximum 16 characters. If the established series uses a different valid format, adapt/migrate it explicitly before enabling rather than replacing it implicitly. Starting-sequence edits never reset an existing counter.
7. Confirm dispatch is the correct issuance event for these goods and business process. The admin transition to Shipped, Out for Delivery or Delivered issues once. An unpaid online order cannot be issued; COD remains Pending until actual collection is recorded. Payment callbacks, previews and downloads never allocate invoice numbers.
8. Use a transaction-capable MongoDB replica set (Atlas qualifies), and ensure the unique Invoice and InvoiceSequence indexes are present. Retain and back up issued PDF bytes, their SHA-256 hashes, snapshots and numbering records. The service initializes its unique indexes before issuance.
9. Enable tax checkout only after the approval note and required policies are complete. Until then new tax checkout and issuance are blocked. No live settings have been enabled by this work.

## Supported scope and review boundaries

- Domestic ordinary consumer supplies: place of supply follows confirmed delivery, including different consumer billing/delivery addresses. GPS is never a tax input.
- Registered ordinary supplies: validated buyer GSTIN and billing state; interstate bill-to/ship-to requires explicit selection. A directing registered buyer's principal state is used for the supported section 10(1)(b) case.
- Taxable, nil-rated, exempt and non-GST lines remain distinct. Taxable-only uses Tax Invoice; non-taxable-only uses Bill of Supply; eligible unregistered mixed taxable/exempt supplies use Invoice-cum-Bill of Supply. Registered mixed taxable/exempt supplies require separate documents and are blocked for review.
- SEZ, exports, other special supplies, cess and reverse charge are explicitly blocked. They are not silently treated as ordinary zero-tax supplies. Actual IRN/signed IRP QR integration and automated credit-note issuance are not implemented.
- Buyer GSTIN validation checks structure, checksum and state consistency; it is not a live registration verification.

## Calculation and history contracts

`src/lib/tax.ts` is the shared calculation engine. Prices are converted from at most two decimal places into integer paise. Ratios use BigInt and half-up rounding. Discounts use deterministic largest-remainder allocation before supply. Each line retains description, SKU, variant, HSN, quantity/unit, price basis, unit price, discount, treatment, GST rate, taxable value, tax components and final value. Odd intra-state GST paise are assigned to SGST/UTGST; optional final-rupee rounding is disclosed. Subtotals include shipping taxable/supply value; discount and shipping reference rows are not added twice.

The quote and order routes independently load trusted catalog data and use the same engine. Orders store immutable tax, buyer, seller and address snapshots. A submitted quote hash detects a changed quote. Razorpay takes the recorded order total in paise and rejects a snapshot mismatch. Exports and refundable product values use the snapshot rather than current product tax settings.

Issuance transactionally allocates the FY number, writes the immutable invoice document and PDF, and links the order. Unique indexes, MongoDB transaction retries and duplicate-key retry handling protect simultaneous issuance. Downloads return stored bytes without reading current product settings or rendering again. Settings/product changes cannot rewrite issued documents. A PDF states payment status **at issue**; the order UI separately shows current payment status.

Legacy orders retain recorded totals. Downloads are distinctly labelled order summaries/drafts with missing-tax and unverified-historical-seller warnings; they are not retroactively converted into tax invoices. No historical records were bulk updated.

The existing refund flow remains the financial refund path. Tax-aware item refund amounts include their recorded GST. Issued invoices are never edited by refunds. Admin order details flag accountant/credit-note review following a refund. A payment refund is not a GST credit note: record the legally appropriate linked credit note in the accounting workflow and retain the original invoice. There was no existing credit-note generator or invoice-email sender. `issuedInvoiceAttachment()` returns the exact stored PDF for a future authorized sender; this work sends no invoice email.

## Delivery QR and access

QR generation is local using `qrcode`, error correction M, a four-module quiet zone and an adaptive physical size of at least 38 mm. Payload: order reference, recipient name, confirmed shipping address and PIN only. Phone, email, coordinates, instructions and payment credentials are excluded. The address remains printed normally. It is labelled **Delivery address**, never GST verified or e-invoice QR.

`GET /api/orders/[id]/invoice` checks the existing signed customer/admin session and customer ownership before accessing the document. The route returns private/no-store PDF responses. `?download=1` changes disposition only. Admin view/print/download, customer preview/download and the attachment helper share the same renderer or stored PDF bytes.

## Verification

Local verification on 13 October 2026: **61/61 tests passed**; type checking and production build passed. The replica-set concurrency test, rendered-PDF QR decoding, and desktop/mobile browser checks passed. The browser test also verifies customer PDF preview/download and native-dialog Escape dismissal. Build output is saved in `output/invoice-build.log`. The build intentionally uses an unreachable local database URI, so a storefront fallback warning is expected. No production database was used.

- `npm test`: focused tax, trusted checkout, product preservation, authorization, legacy history and existing regression tests.
- `npm run test:invoice-issuance`: starts a disposable local MongoDB 8.2.6 replica set. Twelve concurrent calls for three orders yield three unique invoices and a sequence value of three; repeats preserve bytes, immutable fields resist updates, and unpaid online issuance is blocked. COD collection recorded with dispatch appears correctly in the issued document. Changing e-invoice applicability before issuance blocks B2B issuance pending IRP integration. Never reads the configured production URI.
- `npm run test:invoice-pdf`: creates three labelled synthetic PDFs in `output/pdf`, renders every page with PDF.js/native canvas, checks embedded ₹ extraction, page markers, and decodes each invoice QR from the rendered page using ZXing. No external QR service is contacted. The samples cover mixed intra-state inclusive/exclusive prices, interstate tax and 38 lines with a long address over six pages. PDF.js is used because Poppler was not available on this machine.
- `npm run test:invoice-ui`: requires Playwright and a local server on port 3000 with `JWT_SECRET=synthetic-local-invoice-browser-check-only-2026` and a dummy MongoDB URI. Set `PLAYWRIGHT_MODULE` to an installed Playwright module if it is not on the normal module path. All API calls are intercepted; settings saves go to fixtures only. Tests product editing/preview, desktop/mobile checkout and progression to payment without submitting payment. Screenshots are in `output/invoice-ui`.
- Type check: `npx tsc --noEmit --incremental false`. Build with a dummy database URI and separate `NEXT_DIST_DIR` so no production database is contacted. `npm run lint` remains unconfigured in the existing repository and prompts for ESLint setup.

Sample rates and HSNs are test data, not classification recommendations. Generated samples are not real invoices.

## Sources reviewed

- [IGST Act, section 10 (India Code)](https://www.indiacode.nic.in/bitstream/123456789/2251/4/a2017-13.pdf): ordinary movement and bill-to/ship-to place of supply.
- [Circular 209/3/2024-GST](https://gstcouncil.gov.in/sites/default/files/2024-09/circular-no-209-03-2024.pdf): consumer delivery address when billing and delivery differ.
- [CGST invoice rules, including Rule 46/46A](https://cbic-gst.gov.in/pdf/cgst-rules-30122017.pdf): invoice particulars and eligible invoice-cum-bill of supply. Check subsequent amendments with the accountant before activation.
- [CGST Act section 15](https://taxinformation.cbic.gov.in/content-page/explore-act/1000284/1000001): valuation, incidental charges and discounts.
- [Official e-invoice mandate guidance](https://einvoice6.gst.gov.in/content/einvoice-mandate/): applicability must be assessed against actual turnover and exceptions, which were not supplied.

## Main implementation files

| Area | Files |
| --- | --- |
| Tax/settings contracts | `src/lib/tax.ts`, `tax-types.ts`, `business-settings.ts`, `server-business-settings.ts`, `server-checkout-tax.ts` |
| Persistence | `src/models/Product.ts`, `Order.ts`, `BusinessSettings.ts`, `Invoice.ts`, `InvoiceSequence.ts`; `src/lib/types.ts`, `serializers.ts` |
| Invoice document/PDF/issuance | `src/lib/invoice-document.ts`, `invoice-pdf.ts`, `server-invoice.ts`; `src/app/api/orders/[id]/invoice/route.ts` |
| Admin settings/product tax | `src/components/admin/BusinessInvoiceSettings.tsx`, `ProductTaxFields.tsx`; dashboard, shell/navigation; admin business-settings and product routes |
| Checkout/payment | quote and order routes; Razorpay create-order route; `useCheckoutTaxQuote.ts`, `CheckoutBillingFields.tsx`, `CheckoutTaxSummary.tsx`, `CheckoutModal.tsx`, store and coupon helpers |
| Access/exports/refunds | `generateInvoice.ts`, `InvoicePreviewModal.tsx`, admin OrderDetails, customer orders, `exportOrderExcel.ts`, `refunds.ts` |
| Assets/tooling/tests | `public/brand/techai-logo.png`, `public/fonts/*`, `next.config.ts`, package manifests, `tests/invoice-*`, `tests/tax.test.cjs`, `tests/render-invoice-samples.cjs`, updated checkout/coupon regression fixtures |
