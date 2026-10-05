/** Public storefront settings. Never put secrets in this file. */
export const storefrontConfig = {
  companyName: "TECH AI",
  helpline: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  // ISO date with timezone. Leave empty until a real end time is agreed.
  flashDealsEndAt: "",
  delivery: {
    // Populate the complete service area before enabling availability checks.
    coverageConfigured: false,
    serviceablePincodes: [] as string[],
  },
};

export function checkPincode(pincode: string) {
  if (!/^[1-9]\d{5}$/.test(pincode)) return "invalid";
  if (!storefrontConfig.delivery.coverageConfigured) return "unknown";
  return storefrontConfig.delivery.serviceablePincodes.includes(pincode) ? "available" : "unavailable";
}
