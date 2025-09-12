import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import ShopifyShop from "@/models/ShopifyShop";
import { getShopifyAbandonedCarts } from "@/lib/shopify";
import {
  logApiError,
  logApiSuccess,
  logAuthFailure,
  logDbOperation,
  logExternalApi,
  logExternalApiError,
} from "@/lib/apiLogger";

export async function GET(request) {
  let session;

  try {
    // Get user session with authOptions
    session = await getServerSession(authOptions);

    console.log("session", session);
    if (!session?.user?.email) {
      logAuthFailure(
        "GET",
        "/api/shopify/abandoned-carts",
        null,
        "No session or user email"
      );
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    // Find user
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      logAuthFailure(
        "GET",
        "/api/shopify/abandoned-carts",
        session.user,
        "User not found in database"
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get query parameters for shop selection
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get("shop");
    const limit = parseInt(searchParams.get("limit")) || 50;

    // Find active Shopify connection for this user
    let shopConnection;
    if (shop) {
      // If specific shop is requested, find that connection
      shopConnection = await ShopifyShop.findOne({
        userId: user._id,
        shop: shop,
        isActive: true,
      });
    } else {
      // If no shop specified, get the first active connection
      shopConnection = await ShopifyShop.findOne({
        userId: user._id,
        isActive: true,
      });
    }

    if (!shopConnection) {
      logApiError(
        "GET",
        "/api/shopify/abandoned-carts",
        400,
        new Error("No active Shopify connection found"),
        session.user,
        {
          requestedShop: shop,
        }
      );
      return NextResponse.json(
        {
          error:
            "No active Shopify connection found. Please connect your store first.",
        },
        { status: 400 }
      );
    }

    logDbOperation("read", "ShopifyShop", session.user, {
      operation: "find_shop_connection_for_abandoned_carts",
      shop: shopConnection.shop,
      shopId: shopConnection._id.toString(),
    });

    // Fetch abandoned carts from Shopify
    logExternalApi("Shopify", "fetch_abandoned_carts", user._id.toString(), {
      shop: shopConnection.shop,
      limit,
    });

    const abandonedCarts = await getShopifyAbandonedCarts(
      shopConnection.shop,
      shopConnection.accessToken,
      limit
    );

    logApiSuccess("GET", "/api/shopify/abandoned-carts", 200, session.user, {
      shop: shopConnection.shop,
      cartCount: abandonedCarts.length,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: abandonedCarts,
      count: abandonedCarts.length,
    });
  } catch (error) {
    logExternalApiError(
      "Shopify",
      "fetch_abandoned_carts",
      error,
      session?.user,
      {
        shop: new URL(request.url).searchParams.get("shop"),
      }
    );

    logApiError(
      "GET",
      "/api/shopify/abandoned-carts",
      500,
      error,
      session?.user,
      {
        shop: new URL(request.url).searchParams.get("shop"),
        limit: new URL(request.url).searchParams.get("limit"),
      }
    );

    return NextResponse.json(
      { error: "Failed to fetch abandoned carts" },
      { status: 500 }
    );
  }
}
