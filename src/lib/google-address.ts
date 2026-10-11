export type Coordinates = { lat: number; lng: number };
export type AddressSuggestion = {
  description: string;
  houseNumber: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  countryCode: string;
  coordinates: Coordinates;
};
type Component = {
  types: string[];
  longText?: string | null;
  shortText?: string | null;
  long_name?: string;
  short_name?: string;
};

// Places (New) and the JS Geocoder use different component property names.
export function parseGoogleAddress(
  components: readonly Component[],
  description: string,
  coordinates: Coordinates,
): AddressSuggestion {
  const find = (...types: string[]) => {
    for (const type of types) {
      const component = components.find((c) => c.types.includes(type));
      if (component) return component.longText || component.long_name || "";
    }
    return "";
  };
  const country = components.find((c) => c.types.includes("country"));
  const street = [
    find("route"),
    find("sublocality_level_2"),
    find("sublocality_level_1", "sublocality", "neighborhood"),
  ];
  return {
    description,
    coordinates,
    houseNumber: find("street_number"),
    street: [...new Set(street.filter(Boolean))].join(", "),
    // A district is not necessarily a city; leave missing cities editable.
    city: find("locality", "postal_town"),
    state: find("administrative_area_level_1"),
    pincode: find("postal_code"),
    country: find("country"),
    countryCode: country?.shortText || country?.short_name || "",
  };
}

export function validCoordinates(value: unknown): value is Coordinates {
  if (!value || typeof value !== "object") return false;
  const { lat, lng } = value as Coordinates;
  return (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    typeof lng === "number" &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180
  );
}

export function locationQuality(
  position: Pick<GeolocationPosition, "timestamp" | "coords">,
  now = Date.now(),
) {
  if (
    !Number.isFinite(position.timestamp) ||
    now - position.timestamp > 30000 ||
    position.timestamp > now + 5000
  )
    return "Your device returned an old location. Retry, search for your address, or enter it manually.";
  if (
    !Number.isFinite(position.coords.accuracy) ||
    position.coords.accuracy < 0 ||
    position.coords.accuracy > 100
  )
    return "Your location is too approximate to suggest a delivery address. Retry outdoors, search, or enter it manually.";
  if (
    !validCoordinates({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    })
  )
    return "Your device could not provide a usable location. Search or enter your address manually.";
  return "";
}
