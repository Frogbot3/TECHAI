import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing lat/lng coordinates" }, { status: 400 });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ error: "Invalid coordinates format" }, { status: 400 });
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // 1. Google Reverse Geocode if key configured
    if (googleApiKey) {
      try {
        const googleRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}`
        );
        if (googleRes.ok) {
          const gData = await googleRes.json();
          if (gData.status === "OK" && gData.results?.[0]) {
            const result = gData.results[0];
            const components = result.address_components || [];

            let houseNumber = "";
            let street = "";
            let area = "";
            let city = "";
            let state = "";
            let pincode = "";
            let country = "India";

            for (const c of components) {
              const types = c.types || [];
              if (types.includes("street_number")) houseNumber = c.long_name;
              if (types.includes("route")) street = c.long_name;
              if (types.includes("sublocality") || types.includes("neighborhood")) area = c.long_name;
              if (types.includes("locality")) city = c.long_name;
              if (types.includes("administrative_area_level_1")) state = c.long_name;
              if (types.includes("postal_code")) pincode = c.long_name;
              if (types.includes("country")) country = c.long_name;
            }

            return NextResponse.json({
              success: true,
              address: {
                formattedAddress: result.formatted_address,
                houseNumber,
                street: [houseNumber, street].filter(Boolean).join(" ") || street || area,
                area,
                city,
                state,
                pincode,
                country,
                lat: latitude,
                lng: longitude,
              },
              provider: "google",
            });
          }
        }
      } catch (err) {
        console.warn("Google Reverse Geocode failed, falling back to Nominatim:", err);
      }
    }

    // 2. OpenStreetMap Nominatim Reverse Geocoding
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
    const nomRes = await fetch(nomUrl, {
      headers: {
        "User-Agent": "TECHAI-Ecommerce/1.0 (contact: info@techai.com)",
        Accept: "application/json",
      },
      next: { revalidate: 300 },
    });

    if (nomRes.ok) {
      const data = await nomRes.json();
      const addr = data.address || {};

      const houseNumber = addr.house_number || "";
      const road = addr.road || addr.street || "";
      const area = addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict || "";
      const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
      const state = addr.state || "";
      const pincode = addr.postcode || "";
      const country = addr.country || "India";

      const street = [houseNumber, road].filter(Boolean).join(" ") || road || area;

      return NextResponse.json({
        success: true,
        address: {
          formattedAddress: data.display_name || `${street}, ${area}, ${city}, ${state} ${pincode}`,
          houseNumber,
          street: street || (area ? `${area} Street` : "Main Road"),
          area,
          city: city || area,
          state,
          pincode,
          country,
          lat: latitude,
          lng: longitude,
        },
        provider: "nominatim",
      });
    }

    return NextResponse.json({ error: "Unable to reverse geocode coordinates" }, { status: 404 });
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return NextResponse.json({ error: "Failed to reverse geocode location" }, { status: 500 });
  }
}
