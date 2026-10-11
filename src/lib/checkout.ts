import type { ShippingAddress } from "./types";
import type { AddressSuggestion } from "./google-address";
import { checkPincode } from "./storefront-config";

// Shared by cart previews and order creation. Legacy deliveryType is never priced.
export function standardShippingFee(subtotal: number) {
  return subtotal === 0 || subtotal > 499 ? 0 : 49;
}

export function checkoutAddress(saved?: Partial<ShippingAddress>, contact?: { name?: string; phone?: string; email?: string }): ShippingAddress {
  return {
    fullName: saved?.fullName || contact?.name || "", phone: saved?.phone || contact?.phone || "",
    email: saved?.email || contact?.email || "", houseNumber: saved?.houseNumber || "",
    street: saved?.street || "", city: saved?.city || "", state: saved?.state || "",
    pincode: saved?.pincode || "", country: "India", landmark: saved?.landmark || "",
    deliveryInstructions: saved?.deliveryInstructions || "", coordinates: saved?.coordinates,
  };
}

export function confirmedAddress(previous: ShippingAddress, suggestion: AddressSuggestion): ShippingAddress {
  return { ...previous, houseNumber: previous.houseNumber || suggestion.houseNumber,
    street: suggestion.street, city: suggestion.city, state: suggestion.state,
    pincode: suggestion.pincode, country: "India", coordinates: suggestion.coordinates };
}

export function validateCheckoutAddress(address: ShippingAddress) {
  const errors: Record<string, string> = {};
  if (!address.fullName.trim()) errors.fullName = "Enter your full name.";
  if (!/^[6-9]\d{9}$/.test(address.phone.replace(/\D/g, ""))) errors.phone = "Enter a valid 10-digit mobile number.";
  if (address.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) errors.email = "Enter a valid email or leave it empty.";
  if (!address.houseNumber?.trim()) errors.houseNumber = "Enter a house, flat or building.";
  if (!address.street.trim()) errors.street = "Enter your street or area.";
  if (!/^[1-9]\d{5}$/.test(address.pincode)) errors.pincode = "Enter a valid 6-digit PIN code.";
  else if (checkPincode(address.pincode) === "unavailable") errors.pincode = "Delivery is unavailable here. Try another address.";
  if (!address.city.trim()) errors.city = "Enter your city.";
  if (!address.state.trim()) errors.state = "Enter your state.";
  return errors;
}

export function clearLegacyCheckoutKeys(storage: Storage) {
  // Invalidate old checkout IDs so a fresh checkout cannot resume a priority order.
  // Recorded orders themselves remain untouched.
  for (let index = storage.length - 1; index >= 0; index--) {
    const key = storage.key(index);
    if (key?.startsWith("techai-checkout-id:")) storage.removeItem(key);
  }
}
