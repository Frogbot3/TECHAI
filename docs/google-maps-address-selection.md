# Google Maps delivery address picker

The existing Next.js 15 / React 19 checkout uses `PlaceAutocompleteElement` (Places New), the browser Maps JavaScript Geocoder, and a Google map with a fixed centre pin. Maps is optional. The SDK loads once after focusing the address-search input or choosing Use my location, never on initial storefront load. Manual fields are immediately available. No runtime Maps wrapper was added; `@types/google.maps` is development-only.

## Google Cloud and Vercel

1. In the same Google Cloud project as the browser key, enable billing, **Maps JavaScript API**, **Places API (New)** and **Geocoding API**. Restrict the key to those APIs.
2. Set application restrictions to **Websites (HTTP referrers)**:
   - `https://techai-theta.vercel.app/*`
   - `http://localhost:3000/*`
3. Put the browser key in `.env.local` as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. The example file contains only a placeholder. Never paste the real value into source, tickets or logs.
4. Set the same variable for the appropriate Vercel environment. Public Next.js variables are embedded at build time: a fresh build/deployment is required after changing them. This task does not deploy.
5. Preview deployments and `127.0.0.1` / other ports are not covered by these referrers. Add only the specific origins you intend to test, or test at `http://localhost:3000`.
6. No map ID is needed. This implementation does **not** use AdvancedMarkerElement or a demo map ID; it uses an accessible, keyboard-pannable map underneath a fixed visual pin. If replaced with Advanced Markers later, configure a production map ID before release.
7. Set appropriate API quotas and billing alerts in Google Cloud. Do not remove website restrictions to work around failures. The browser key is necessarily visible in browser requests; restrictions, not secrecy, protect it.

The legacy `/api/geocode/reverse` endpoint can use only a separately configured server key (`GOOGLE_MAPS_API_KEY`). It no longer reads the website-restricted public key. Checkout never calls either legacy geocoder endpoint. Checkout now displays the same `checkPincode` result as the navbar, beside the PIN and in the saved-address summary. Unconfigured coverage remains explicitly unknown.

## Address handling

- `gmp-select` supplies a place prediction; `toPlace().fetchFields()` requests only `addressComponents`, `formattedAddress`, and `location`. The Google widget owns its prediction UI, attribution and session tokens.
- Components are matched by type across Places camelCase and Geocoder snake_case fields. Missing components stay empty. A district is not treated as a city.
- A selected suggestion is a draft. **Use this address** explicitly replaces street/locality, city, state, country and PIN, including empty fields. Existing house/flat and landmark entries are kept for customer review. A missing PIN must be entered in checkout before proceeding.
- Moving the map invalidates the draft. **Review map position** reverse-geocodes once; the customer then confirms the resulting suggestion. No movement-frame geocoding or continuous GPS tracking occurs.
- Use my location requests high accuracy with `maximumAge: 0` and a 15-second timeout. Readings older than 30 seconds, with invalid coordinates, or with accuracy worse than 100 metres are rejected with retry/search/manual options. GPS does not identify a flat or entrance.
- Sequence/revision checks invalidate responses after new searches, manual edits, saved-address selection, cancellation and unmount. Editing location fields clears an old confirmed pin. Profile refreshes for the same account do not overwrite the active form.
- Optional house/flat, country, delivery instructions and coordinates are retained in the existing saved-address schema and immutable order snapshot. Old records need no migration. No production records are modified by this change.
- A Google address or syntactically valid PIN does not establish serviceability. Existing delivery checks, payment verification, prices and order statuses are unchanged.

The address step uses a selected-address summary with Change/Edit actions, or an immediate manual form for new customers. Optional landmark/instructions stay in state when collapsed. Country is India in new snapshots; there is no default state. The previous Karnataka fallback could produce an inconsistent combination when saved data lacked a state, but the original screenshot's data source has not been confirmed.

New checkouts always use standard shipping (₹49 through ₹499; free above ₹499), shared with cart previews and the server. Legacy delivery selections are discarded during cart normalization; old checkout-ID keys are cleared and replaced with an account-scoped standard-checkout namespace. The server ignores incoming speed/fee values and calculates totals from trusted product prices. Existing orders and their payment/invoice amounts are unchanged. Save this address is passed to order creation; editing a selected address updates that saved slot for the signed-in customer, while adding an address preserves other slots.

## Verification

Run `npm test`, `npx tsc --noEmit`, and `npm run build`. `npm run lint` uses the existing Next lint script; configure ESLint separately if the repository has no ESLint setup.

Browser checks should cover search/confirmation, map adjustment, permission denial/timeout, poor accuracy, missing PIN, manual edits during pending lookups, saved addresses, cancellation, service failures, and mobile dropdowns inside checkout. Never click Confirm Order or initiate a real payment while testing. Mock app APIs and GPS for deterministic tests; a real-device GPS accuracy/permission check remains necessary before release.

Verified locally: 46 automated tests, TypeScript, production build, and mocked checkout workflows at 360, 390, 768 and 1440px. Saved selection/edit/add, field validation and focus, optional details, address/payment back navigation, background locking, totals, and reduced-height keyboard simulation passed without overflow or runtime errors. Google confirmation, missing components, map adjustment, stale search/GPS responses and failure retries passed with mocked Maps responses. Physical-device keyboard and GPS behavior remains unverified. The real Google Places widget returned India suggestions and place details; its mobile fullscreen dropdown and attribution rendered correctly. The real map/Geocoder path returned `RefererNotAllowedMapError` at `http://localhost:3000`. Verify the localhost referrer on the exact browser key configured in the local environment; do not remove restrictions. Live map tiles, adjusted-position reverse geocoding, production-domain behavior, and physical-device GPS remain release checks after that configuration is corrected. `npm run lint` currently prompts to configure ESLint; no existing noninteractive lint setup is available.

Official references:
- https://developers.google.com/maps/documentation/javascript/place-autocomplete-new
- https://developers.google.com/maps/documentation/javascript/reference/places-widget
- https://developers.google.com/maps/documentation/javascript/geocoding
- https://developers.google.com/maps/documentation/javascript/load-maps-js-api
