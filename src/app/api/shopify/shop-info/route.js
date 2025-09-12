import { NextResponse } from "next/server";
import { logApiError } from "@/lib/apiLogger";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: "Shop ID is required" },
        { status: 400 }
      );
    }

    // Import ShopifyShop model
    const { default: ShopifyShop } = await import("@/models/ShopifyShop");

    // First, get the shop document from database
    const shopDoc = await ShopifyShop.findById(shopId);
    if (!shopDoc) {
      return NextResponse.json(
        { success: false, error: "Shop not found" },
        { status: 404 }
      );
    }

    // Check if we have stored shop info
    if (shopDoc.shopifyShopInfo) {
      return NextResponse.json({
        success: true,
        data: shopDoc.shopifyShopInfo,
      });
    }

    // Fallback: fetch from Shopify API if not stored
    const { shop, accessToken } = shopDoc;

    const url = `https://${shop}/admin/api/${
      process.env.SHOPIFY_VERSION || "2025-07"
    }/shop.json`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch shop info: ${response.statusText}`);
    }

    const data = await response.json();
    const shopInfo = data.shop;

    // Store the shop info for future use
    await ShopifyShop.findByIdAndUpdate(shopId, {
      shopifyShopInfo: shopInfo,
    });

    return NextResponse.json({
      success: true,
      data: shopInfo,
    });
  } catch (error) {
    logApiError("GET /api/shopify/shop-info", error, {
      searchParams: Object.fromEntries(new URL(request.url).searchParams),
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch shop info",
      },
      { status: 500 }
    );
  }
}
