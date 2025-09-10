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

    // Check if we have stored discount codes
    if (shopDoc.discountCodes) {
      return NextResponse.json({
        success: true,
        data: shopDoc.discountCodes,
      });
    }

    // Fallback: fetch from Shopify API if not stored
    const { shop, accessToken } = shopDoc;

    // Fetch discount codes from Shopify
    const shopifyUrl = `https://${shop}/admin/api/${
      process.env.SHOPIFY_VERSION || "2025-07"
    }/price_rules.json`;

    const response = await fetch(shopifyUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch discount codes: ${response.statusText}`);
    }

    const data = await response.json();
  
    // Extract discount codes from price rules
    const discountCodes = [];
    if (data.price_rules) {
      for (const priceRule of data.price_rules) {
        // Fetch discount codes for each price rule
        const codesUrl = `https://${shop}/admin/api/${
          process.env.SHOPIFY_VERSION || "2025-07"
        }/price_rules/${priceRule.id}/discount_codes.json`;
        try {
          const codesResponse = await fetch(codesUrl, {
            method: "GET",
            headers: {
              "X-Shopify-Access-Token": accessToken,
              "Content-Type": "application/json",
            },
          });

          if (codesResponse.ok) {
            const codesData = await codesResponse.json();
            if (codesData.discount_codes) {
              for (const discountCode of codesData.discount_codes) {
                discountCodes.push({
                  id: discountCode.id,
                  code: discountCode.code,
                  title: priceRule.title,
                  value: priceRule.value,
                  value_type: priceRule.value_type,
                  starts_at: priceRule.starts_at,
                  ends_at: priceRule.ends_at,
                  usage_limit: priceRule.usage_limit,
                  usage_count: priceRule.usage_count,
                });
              }
            }
          }
        } catch (error) {
          console.error(
            `Error fetching codes for price rule ${priceRule.id}:`,
            error
          );
        }
      }
    }

    // Store the discount codes for future use
    // await ShopifyShop.findByIdAndUpdate(shopId, {
    //   discountCodes: discountCodes,
    // });

    return NextResponse.json({
      success: true,
      data: discountCodes,
    });
  } catch (error) {
    logApiError("GET /api/shopify/discount-codes", error, {
      searchParams: Object.fromEntries(new URL(request.url).searchParams),
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch discount codes",
      },
      { status: 500 }
    );
  }
}
