import { NextRequest, NextResponse } from "next/server";

interface GeocodeSuggestion {
  id: string;
  description: string;
  mainText: string;
  secondaryText: string;
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // 1. Attempt Google Places API if API key is configured
    if (googleApiKey) {
      try {
        const googleRes = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            query
          )}&components=country:in&key=${googleApiKey}`,
          { next: { revalidate: 300 } }
        );
        if (googleRes.ok) {
          const googleData = await googleRes.json();
          if (googleData.status === "OK" && Array.isArray(googleData.predictions)) {
            const suggestions: GeocodeSuggestion[] = googleData.predictions.map((p: any) => ({
              id: p.place_id,
              description: p.description,
              mainText: p.structured_formatting?.main_text || p.description,
              secondaryText: p.structured_formatting?.secondary_text || "",
            }));
            return NextResponse.json({ suggestions, provider: "google" });
          }
        }
      } catch (err) {
        console.warn("Google Places Autocomplete failed, falling back to OpenStreetMap Photon:", err);
      }
    }

    // 2. High-performance OpenStreetMap / Photon geocoder (optimized for Indian localities & worldwide)
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en`;
    const photonRes = await fetch(photonUrl, {
      headers: {
        "User-Agent": "TECHAI-Ecommerce/1.0",
        Accept: "application/json",
      },
      next: { revalidate: 300 },
    });

    if (photonRes.ok) {
      const data = await photonRes.json();
      if (Array.isArray(data.features) && data.features.length > 0) {
        const suggestions: GeocodeSuggestion[] = data.features.map((f: any, idx: number) => {
          const p = f.properties || {};
          const coords = f.geometry?.coordinates || [];
          const lng = coords[0];
          const lat = coords[1];

          const name = p.name || "";
          const street = p.street || "";
          const housenumber = p.housenumber || "";
          const district = p.district || p.suburb || p.locality || "";
          const city = p.city || p.county || district || "";
          const state = p.state || "";
          const pincode = p.postcode || "";
          const country = p.country || "India";

          const parts = [housenumber, street, name, district, city, state, pincode]
            .filter((val, i, arr) => val && arr.indexOf(val) === i);

          const fullAddress = parts.join(", ");
          const main = name || street || city || query;
          const secondary = [district, city, state, pincode, country].filter(Boolean).join(", ");

          return {
            id: `photon-${p.osm_id || idx}-${lat}-${lng}`,
            description: fullAddress || `${main}, ${secondary}`,
            mainText: main,
            secondaryText: secondary,
            houseNumber: housenumber,
            street: [housenumber, street].filter(Boolean).join(" ") || street || name,
            area: district || name,
            city: city || district,
            state: state,
            pincode: pincode,
            country: country,
            lat,
            lng,
          };
        });

        return NextResponse.json({ suggestions, provider: "photon" });
      }
    }

    // 3. Fallback to OpenStreetMap Nominatim search if Photon returns empty
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&addressdetails=1&countrycodes=in&limit=6`;
    const nomRes = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "TECHAI-Ecommerce/1.0 (contact: info@techai.com)",
        Accept: "application/json",
      },
      next: { revalidate: 300 },
    });

    if (nomRes.ok) {
      const nomData = await nomRes.json();
      if (Array.isArray(nomData)) {
        const suggestions: GeocodeSuggestion[] = nomData.map((item: any) => {
          const addr = item.address || {};
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          const city = addr.city || addr.town || addr.village || addr.county || "";
          const state = addr.state || "";
          const pincode = addr.postcode || "";
          const street = [addr.house_number, addr.road].filter(Boolean).join(" ") || addr.road || "";
          const area = addr.suburb || addr.neighbourhood || addr.residential || "";

          return {
            id: `nom-${item.place_id}`,
            description: item.display_name,
            mainText: item.name || street || area || city || query,
            secondaryText: [area, city, state, pincode].filter(Boolean).join(", "),
            houseNumber: addr.house_number || "",
            street: street || area,
            area: area,
            city: city,
            state: state,
            pincode: pincode,
            country: addr.country || "India",
            lat,
            lng,
          };
        });

        return NextResponse.json({ suggestions, provider: "nominatim" });
      }
    }

    return NextResponse.json({ suggestions: [] });
  } catch (error) {
    console.error("Geocode autocomplete route error:", error);
    return NextResponse.json({ suggestions: [], error: "Autocomplete search failed" }, { status: 500 });
  }
}
