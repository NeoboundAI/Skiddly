import { NextResponse } from "next/server";
import { logApiError } from "@/lib/apiLogger";

// Required environment variable: GOOGLE_PLACES_API_KEY
// Get your API key from: https://console.cloud.google.com/apis/credentials
// Enable the Places API in your Google Cloud project

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const type = searchParams.get("type") || "cities"; // cities, countries, states

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query parameter is required" },
        { status: 400 }
      );
    }

    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!googleApiKey) {
      return NextResponse.json(
        { success: false, error: "Google Places API key not configured" },
        { status: 500 }
      );
    }

    // Use Google Places API Autocomplete for better city results
    let searchType = "(cities)";
    if (type === "countries") {
      searchType = "(countries)";
    } else if (type === "states") {
      searchType = "(regions)";
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      query
    )}&types=${searchType}&key=${googleApiKey}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    console.log("Google Places API response:", data);

    // Format the results for our use case
    const places = data.predictions.map((prediction) => {
      const addressParts = prediction.description
        .split(",")
        .map((part) => part.trim());

      return {
        id: prediction.place_id,
        name: prediction.structured_formatting.main_text,
        formatted_address: prediction.description,
        types: prediction.types,
        country: addressParts[addressParts.length - 1],
        city: prediction.structured_formatting.main_text,
        state:
          addressParts.length > 2
            ? addressParts[addressParts.length - 2]
            : null,
        display_name: prediction.description,
      };
    });

    return NextResponse.json({
      success: true,
      data: places,
    });
  } catch (error) {
    logApiError("GET /api/google/places", error, {
      searchParams: Object.fromEntries(new URL(request.url).searchParams),
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch places",
      },
      { status: 500 }
    );
  }
}
