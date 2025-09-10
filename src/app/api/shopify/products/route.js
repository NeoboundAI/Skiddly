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

    // Check if we have stored products
    if (shopDoc.products) {
      return NextResponse.json({
        success: true,
        data: shopDoc.products,
      });
    }

    // Fallback: fetch from Shopify API if not stored
    const { shop, accessToken } = shopDoc;

    const url = `https://${shop}/admin/api/${
      process.env.SHOPIFY_VERSION || "2025-07"
    }/products.json?limit=250`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
    });

    console.log("response", response);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const data = await response.json();
  
    const products = data.products.map((product) => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      vendor: product.vendor,
      product_type: product.product_type,
      status: product.status,
      created_at: product.created_at,
      updated_at: product.updated_at,
      published_at: product.published_at,
      tags: product.tags,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        title: variant.title,
        price: variant.price,
        sku: variant.sku,
        inventory_quantity: variant.inventory_quantity,
        weight: variant.weight,
        weight_unit: variant.weight_unit,
      })),
    }));

    // Store the products for future use
    await ShopifyShop.findByIdAndUpdate(shopId, {
      products: products,
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    logApiError("GET /api/shopify/products", error, {
      searchParams: Object.fromEntries(new URL(request.url).searchParams),
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}
