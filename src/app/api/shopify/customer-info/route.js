import { NextResponse } from "next/server";
import { logApiError } from "@/lib/apiLogger";
import connectDB from "@/lib/mongodb";
import ShopifyShop from "@/models/ShopifyShop";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const shopId = searchParams.get("shopId");

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      );
    }

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: "Shop ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get the shop document from database
    const shopDoc = await ShopifyShop.findById(shopId);
    if (!shopDoc) {
      return NextResponse.json(
        { success: false, error: "Shop not found" },
        { status: 404 }
      );
    }

    const { shop, accessToken } = shopDoc;

    // Fetch customer info from Shopify API
    const url = `https://${shop}/admin/api/${
      process.env.SHOPIFY_VERSION || "2025-07"
    }/customers/${customerId}.json`;

    console.log(`Fetching customer info from: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Shopify API error: ${response.status} ${response.statusText}`,
        errorText
      );

      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: "Customer not found" },
          { status: 404 }
        );
      }

      throw new Error(`Failed to fetch customer info: ${response.statusText}`);
    }

    const data = await response.json();
    const customerInfo = data.customer;

    console.log(`Successfully fetched customer info for ID: ${customerId}`);

    return NextResponse.json({
      success: true,
      data: customerInfo,
    });
  } catch (error) {
    logApiError("GET /api/shopify/customer-info", error, {
      searchParams: Object.fromEntries(new URL(request.url).searchParams),
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch customer info",
      },
      { status: 500 }
    );
  }
}
