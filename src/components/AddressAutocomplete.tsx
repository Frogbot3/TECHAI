"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin } from "lucide-react";
import { loadGoogleMaps, withMapsTimeout } from "@/lib/google-maps-client";
import {
  locationQuality,
  parseGoogleAddress,
  type AddressSuggestion,
  type Coordinates,
} from "@/lib/google-address";

export type AddressPayload = AddressSuggestion;
interface Props {
  onAddressSelect: (address: AddressSuggestion) => void;
  addressRevision: number;
}
const button =
  "min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50";

export default function AddressAutocomplete({
  onAddressSelect,
  addressRevision,
}: Props) {
  const [enabled, setEnabled] = useState(false);
  const searchText = useRef("");
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [errorSource, setErrorSource] = useState<"gps" | "maps">("maps");
  const [suggestion, setSuggestion] = useState<AddressSuggestion | null>(null);
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const mapHost = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const widget = useRef<google.maps.places.PlaceAutocompleteElement | null>(
    null,
  );
  const sequence = useRef(0);
  const alive = useRef(true);
  const revision = useRef(addressRevision);
  revision.current = addressRevision;
  const programmaticMove = useRef(false);
  const positionRef = useRef(position);
  positionRef.current = position;
  const begin = (message: string) => {
    const id = ++sequence.current,
      version = revision.current;
    setBusy(message);
    setError("");
    setSuggestion(null);
    return () =>
      alive.current && sequence.current === id && revision.current === version;
  };
  const invalidate = () => {
    sequence.current++;
    setBusy("");
    setSuggestion(null);
  };
  const cancel = () => {
    invalidate();
    setPosition(null);
    setError("");
    if (widget.current) widget.current.value = "";
  };
  const showSuggestion = (next: AddressSuggestion) => {
    if (next.countryCode.toUpperCase() !== "IN")
      throw new Error(
        "We could not identify an address in India. Search again or enter your address manually.",
      );
    setSuggestion(next);
    setPosition(next.coordinates);
    if (map.current) {
      const center = map.current.getCenter()?.toJSON();
      if (center?.lat !== next.coordinates.lat || center?.lng !== next.coordinates.lng) {
        programmaticMove.current = true;
        map.current.setCenter(next.coordinates);
        map.current.setZoom(17);
      }
    }
  };
  useEffect(() => {
    alive.current = true;
    const authFailed = () => {
      sequence.current++;
      setBusy("");
      setSuggestion(null);
      setPosition(null);
      setMapReady(false);
      setReady(false);
      setError(
        "Google Maps is unavailable. Enter your address manually, or reload after checking your connection.",
      );
    };
    window.addEventListener("techai-maps-error", authFailed);
    return () => {
      alive.current = false;
      sequence.current++;
      window.removeEventListener("techai-maps-error", authFailed);
    };
  }, []);
  useEffect(() => {
    sequence.current++;
    setBusy("");
    setSuggestion(null);
    setPosition(null);
    if (widget.current) widget.current.value = "";
  }, [addressRevision]);

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let element: google.maps.places.PlaceAutocompleteElement | null = null;
    const input = () => {
      invalidate();
      setPosition(null);
      setError("");
    };
    const failure = () => {
      invalidate();
      setReady(false);
      setErrorSource("maps");
      setError(
        "Google address search is unavailable. Retry or enter your address manually.",
      );
    };
    const select = async (event: Event) => {
      const current = begin("Finding address…");
      setErrorSource("maps");
      try {
        const place = (
          event as google.maps.places.PlacePredictionSelectEvent
        ).placePrediction.toPlace();
        await withMapsTimeout(
          place.fetchFields({
            fields: ["addressComponents", "formattedAddress", "location"],
          }),
        );
        if (!current() || disposed) return;
        if (!place.location)
          throw new Error(
            "This result has no map position. Search again or enter your address manually.",
          );
        showSuggestion(
          parseGoogleAddress(
            place.addressComponents || [],
            place.formattedAddress || "",
            place.location.toJSON(),
          ),
        );
      } catch (e) {
        if (current() && !disposed)
          setError(
            e instanceof Error
              ? e.message
              : "Could not retrieve this address. Please retry.",
          );
      } finally {
        if (current() && !disposed) setBusy("");
      }
    };
    setBusy("Loading address search…");
    setError("");
    loadGoogleMaps()
      .then(async (maps) => {
        const { PlaceAutocompleteElement } = await withMapsTimeout(
          maps.importLibrary("places") as Promise<google.maps.PlacesLibrary>,
        );
        if (disposed) return;
        element = new PlaceAutocompleteElement({
          includedRegionCodes: ["in"],
          requestedRegion: "in",
          requestedLanguage: "en",
        });
        element.placeholder = "Search your area or address";
        element.id = "checkout-address-search";
        element.setAttribute("aria-label", "Search your area or address");
        element.style.width = "100%";
        element.addEventListener("gmp-select", select);
        element.addEventListener("gmp-error", failure);
        element.addEventListener("input", input);
        element.value = searchText.current;
        widget.current = element;
        host.current?.replaceChildren(element);
        const focusSearch = document.activeElement?.id === "checkout-address-search";
        setReady(true);
        requestAnimationFrame(() => {
          if (!disposed && focusSearch) element?.focus();
        });
        setBusy("");
      })
      .catch((e) => {
        if (!disposed) {
          setBusy("");
          setReady(false);
          setError(e.message);
        }
      });
    window.addEventListener("techai-maps-error", failure);
    return () => {
      disposed = true;
      element?.removeEventListener("gmp-select", select);
      element?.removeEventListener("gmp-error", failure);
      element?.removeEventListener("input", input);
      element?.remove();
      widget.current = null;
      window.removeEventListener("techai-maps-error", failure);
    };
  }, [enabled, attempt]);

  // Retain a single map while the picker is mounted, even after cancellation or editing.
  const [mapRequested, setMapRequested] = useState(false);
  useEffect(() => {
    if (position) setMapRequested(true);
  }, [position]);
  useEffect(() => {
    if (!mapRequested) return;
    const initialPosition = positionRef.current;
    let disposed = false;
    const listeners: google.maps.MapsEventListener[] = [];
    loadGoogleMaps()
      .then(async (maps) => {
        const { Map } = await withMapsTimeout(
          maps.importLibrary("maps") as Promise<google.maps.MapsLibrary>,
        );
        if (disposed || !mapHost.current || !initialPosition) return;
        const instance = new Map(mapHost.current, {
          center: positionRef.current || initialPosition,
          zoom: 17,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          gestureHandling: "cooperative",
          keyboardShortcuts: true,
        });
        map.current = instance;
        setMapReady(true);
        listeners.push(
          instance.addListener("center_changed", () => {
            if (programmaticMove.current || !positionRef.current) return;
            invalidate();
            setError("");
            const center = instance.getCenter();
            if (center) setPosition(center.toJSON());
          }),
        );
        listeners.push(
          instance.addListener("idle", () => {
            programmaticMove.current = false;
          }),
        );
      })
      .catch(() => {
        if (!disposed) {
          setErrorSource("maps");
          setMapRequested(false);
          setError(
            "The map could not load. You can still review the suggestion or enter your address manually.",
          );
        }
      });
    return () => {
      disposed = true;
      listeners.forEach((listener) => listener.remove());
      map.current = null;
      setMapReady(false);
    };
  }, [mapRequested]);

  const reverse = async (coordinates: Coordinates, current: () => boolean) => {
    const maps = await loadGoogleMaps();
    if (!current()) return;
    const { Geocoder } = await withMapsTimeout(
      maps.importLibrary("geocoding") as Promise<google.maps.GeocodingLibrary>,
    );
    if (!current()) return;
    const response = await withMapsTimeout(
      new Geocoder().geocode({ location: coordinates, region: "IN" }),
    );
    if (!current()) return;
    const result = response.results.find((r) =>
      r.address_components.some(
        (c) => c.types.includes("country") && c.short_name === "IN",
      ),
    );
    if (!result)
      throw new Error(
        "No address in India was found here. Search or enter your address manually.",
      );
    showSuggestion(
      parseGoogleAddress(
        result.address_components,
        result.formatted_address,
        coordinates,
      ),
    );
  };
  const reviewPin = async () => {
    if (!position) return;
    const current = begin("Reviewing map position…");
    setErrorSource("maps");
    try {
      await reverse(position, current);
    } catch (e) {
      if (current())
        setError(
          e instanceof Error
            ? e.message
            : "Address lookup failed. Please retry.",
        );
    } finally {
      if (current()) setBusy("");
    }
  };
  const locate = () => {
    const current = begin("Finding your location…");
    setErrorSource("gps");
    setPosition(null);
    if (!navigator.geolocation) {
      setBusy("");
      setError(
        "Your browser cannot provide a location. Search or enter your address manually.",
      );
      return;
    }
    // Permission only follows this button action. Never watch or use IP location.
    navigator.geolocation.getCurrentPosition(
      async (point) => {
        if (!current()) return;
        const quality = locationQuality(point);
        if (quality) {
          setBusy("");
          setError("Couldn’t detect your location accurately. Search or enter your address.");
          return;
        }
        const coordinates = {
          lat: point.coords.latitude,
          lng: point.coords.longitude,
        };
        try {
          setBusy("Finding a nearby address…");
          await reverse(coordinates, current);
        } catch (e) {
          if (current())
            setError(
              e instanceof Error
                ? e.message
                : "Could not resolve this location. Search or enter manually.",
            );
        } finally {
          if (current()) setBusy("");
        }
      },
      (e) => {
        if (!current()) return;
        setBusy("");
        setError(
          e.code === 1
            ? "Location permission was denied. Search or enter your address manually."
            : e.code === 3
              ? "Location request timed out. Retry, search, or enter manually."
              : "Location is unavailable. Retry, search, or enter manually.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  };
  const search = () => {
    cancel();
    setErrorSource("maps");
    if (!enabled) setEnabled(true);
    else if (!ready) setAttempt((n) => n + 1);
    else widget.current?.focus();
  };
  return (
    <section aria-label="Find delivery address" className="space-y-3 min-w-0">
      <label htmlFor="checkout-address-search" className="block text-sm text-slate-700">Search address</label>
      <div className="relative min-w-0" onKeyDown={event => { if (event.key === "Enter") event.preventDefault(); }}>
        {!ready && <input id="checkout-address-search" type="search" placeholder="Search your area or address" autoComplete="off"
          className="h-11 w-full rounded-lg border border-slate-300 px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
          onFocus={() => { if (!enabled) setEnabled(true); }} onChange={event => { searchText.current = event.target.value; }} />}
        <div ref={host} className="min-w-0" hidden={!ready} />
      </div>
      <button type="button" className="flex min-h-9 items-center gap-1.5 text-sm text-teal-800 disabled:opacity-50" disabled={!!busy} onClick={locate}>
        <Crosshair size={15} aria-hidden="true" />Use my location
      </button>
      {busy && (
        <p
          role="status"
          className="flex items-center gap-2 text-xs text-teal-800"
        >
          <Loader2 size={16} className="animate-spin" />
          {busy}
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="text-xs leading-relaxed text-rose-700"
        >
          <p>{error}</p>
          <button
            type="button"
            className="mt-1 min-h-9 text-sm text-teal-800 underline underline-offset-2"
            onClick={() =>
              errorSource === "gps"
                ? locate()
                : position
                  ? void reviewPin()
                  : search()
            }
          >
            Retry
          </button>
        </div>
      )}
      <div hidden={!position}>
        <p className="mb-2 text-xs text-slate-600">
          Move the map under the pin to adjust the delivery position. GPS cannot
          identify your exact flat or entrance.
        </p>
        <div className="relative h-64 sm:h-72 rounded-xl border border-slate-300 overflow-hidden">
          <div
            ref={mapHost}
            className="h-full w-full"
            aria-label="Delivery position map"
          />
          {mapReady && (
            <MapPin
              aria-hidden="true"
              size={36}
              fill="#0891b2"
              stroke="white"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full pointer-events-none drop-shadow-md"
            />
          )}
        </div>
        {!suggestion && (
          <button
            type="button"
            disabled={!!busy || !mapReady}
            className={button + " mt-2"}
            onClick={() => void reviewPin()}
          >
            Review map position
          </button>
        )}
      </div>
      {suggestion && (
        <div
          className="rounded-xl border border-teal-200 bg-white p-3 space-y-2"
          aria-label="Suggested address"
        >
          <h3 className="text-sm font-bold text-slate-900">
            Review suggested address
          </h3>
          <p className="text-xs text-slate-700 break-words">
            {suggestion.description}
          </p>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            {[
              ["Street / locality", suggestion.street],
              ["City", suggestion.city],
              ["State", suggestion.state],
              ["PIN code", suggestion.pincode],
              ["Country", suggestion.country],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-semibold text-slate-900">
                  {value || "Not provided — enter manually"}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-slate-600">
            Confirm to replace the street, city, state and PIN below. Check your
            house/flat number and landmark separately. A map result does not
            confirm delivery availability.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!!busy}
              className={button + " !bg-teal-700 !text-white !border-teal-700"}
              onClick={() => {
                const selected = suggestion;
                invalidate();
                setPosition(null);
                setError("");
                onAddressSelect(selected);
              }}
            >
              Use this address
            </button>
            <button type="button" className={button} onClick={cancel}>
              Cancel suggestion
            </button>
          </div>
        </div>
      )}
      {busy && (
        <button type="button" className={button} onClick={cancel}>
          Cancel lookup
        </button>
      )}
    </section>
  );
}
