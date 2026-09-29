"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Search,
  Crosshair,
  Loader2,
  Building,
  Check,
  AlertCircle,
  ExternalLink,
  Navigation,
} from "lucide-react";

export interface AddressPayload {
  description?: string;
  houseNumber?: string;
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressPayload) => void;
  currentAddressString?: string;
  selectedCoordinates?: { lat: number; lng: number };
}

export default function AddressAutocomplete({
  onAddressSelect,
  currentAddressString = "",
  selectedCoordinates,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    selectedCoordinates || null
  );

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync incoming coordinates
  useEffect(() => {
    if (selectedCoordinates?.lat && selectedCoordinates?.lng) {
      setCoords(selectedCoordinates);
    }
  }, [selectedCoordinates]);

  // Debounced search queries
  const handleQueryChange = (val: string) => {
    setQuery(val);
    setGeoError(null);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (val.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode/autocomplete?q=${encodeURIComponent(val)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setIsOpen(true);
        }
      } catch (err) {
        console.warn("Autocomplete fetch failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 280);
  };

  const handleSelectSuggestion = (item: any) => {
    setQuery(item.mainText || item.description);
    setIsOpen(false);
    if (item.lat && item.lng) {
      setCoords({ lat: item.lat, lng: item.lng });
      setShowMap(true);
    }

    onAddressSelect({
      description: item.description,
      houseNumber: item.houseNumber || "",
      street: item.street || "",
      area: item.area || "",
      city: item.city || "",
      state: item.state || "",
      pincode: item.pincode || "",
      country: item.country || "India",
      lat: item.lat,
      lng: item.lng,
    });
  };

  // Browser Geolocation ("Use My Current Location")
  const handleUseCurrentLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });
        setShowMap(true);

        try {
          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.address) {
              const a = data.address;
              setQuery(a.formattedAddress || `${a.street}, ${a.city}`);
              onAddressSelect({
                description: a.formattedAddress,
                houseNumber: a.houseNumber || "",
                street: a.street || "",
                area: a.area || "",
                city: a.city || "",
                state: a.state || "",
                pincode: a.pincode || "",
                country: a.country || "India",
                lat,
                lng,
              });
            }
          } else {
            setGeoError("Location detected, but address reverse geocoding was incomplete. Please verify the fields below.");
          }
        } catch (err) {
          console.warn("Reverse geocoding failed:", err);
          setGeoError("Unable to resolve detailed address. Please fill in details manually.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError("Location access was denied. Please search or enter address manually.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError("Location information is currently unavailable.");
            break;
          case error.TIMEOUT:
            setGeoError("Location request timed out. Please try again.");
            break;
          default:
            setGeoError("An error occurred while fetching your current location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <div ref={wrapperRef} className="space-y-2.5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-cyan-600" />
          <span>Quick Address Search & Autocomplete</span>
        </label>

        {/* Use My Current Location Button */}
        <button
          type="button"
          disabled={isLocating}
          onClick={handleUseCurrentLocation}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-[11px] font-bold transition-all shadow-2xs active:scale-98 cursor-pointer disabled:opacity-60"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-700" />
          ) : (
            <Crosshair className="w-3.5 h-3.5 text-cyan-700" />
          )}
          <span>{isLocating ? "Detecting GPS location..." : "Use My Current Location"}</span>
        </button>
      </div>

      {/* Autocomplete Input Container */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            placeholder="Search apartment, street, landmark, area or PIN code..."
            className="w-full pl-9 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition font-medium"
          />
          {isLoading && (
            <Loader2 className="w-4 h-4 text-cyan-600 animate-spin absolute right-3 pointer-events-none" />
          )}
        </div>

        {/* Dropdown Suggestions */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-cyan-50/70 transition-colors flex items-start gap-2.5 cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-cyan-100 text-slate-500 group-hover:text-cyan-700 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                  {item.houseNumber || item.street ? (
                    <Building className="w-3.5 h-3.5" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-slate-900 text-xs truncate">
                    {item.mainText}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate leading-snug">
                    {item.secondaryText || item.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Geolocation Feedback Message */}
      {geoError && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Interactive Map Pin Confirmation View */}
      {coords && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-cyan-600" />
              <span>Location Pin Set: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="text-[10px] font-extrabold text-cyan-700 hover:text-cyan-900 underline cursor-pointer"
            >
              {showMap ? "Hide Map" : "View Map"}
            </button>
          </div>

          {showMap && (
            <div className="relative w-full h-36 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
              <iframe
                title="Delivery Location Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.005}%2C${coords.lat - 0.003}%2C${coords.lng + 0.005}%2C${coords.lat + 0.003}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`}
                className="w-full h-full pointer-events-none"
              />
              <div className="absolute bottom-1 right-1 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-600 flex items-center gap-1 shadow-2xs">
                <Check className="w-2.5 h-2.5 text-emerald-600" />
                <span>Delivery Pin Verified</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
