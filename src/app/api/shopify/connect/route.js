import { NextResponse } from "next/server";
import { generateShopifyAuthUrl, validateShopDomain } from "@/lib/shopify";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import ShopifyShop from "@/models/ShopifyShop";
import {
  logApiError,
  logApiSuccess,
  logDbOperation,
  logAuthFailure,
  logExternalApi,
  logBusinessEvent,
} from "@/lib/apiLogger";

export async function POST(request) {
u  let session;

  try {
    session = await getServerSession(authOptions);
    if (!session || !session.user) {
      logAuthFailure(
        "POST",
        "/api/shopify/connect",
        null,
        "No session or user"
      );
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    // Clean up old incomplete connections (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const deletedCount = await ShopifyShop.deleteMany({
      accessToken: null,
      createdAt: { $lt: oneHourAgo },
    });

    if (deletedCount.deletedCount > 0) {
      logDbOperation("delete", "ShopifyShop", session.user, {
        deletedCount: deletedCount.deletedCount,
        reason: "Cleanup incomplete connections",
      });
    }

    const { shop } = await request.json();

    if (!shop) {
      logApiError(
        "POST",
        "/api/shopify/connect",
        400,
        new Error("Shop domain is required"),
        session.user
      );
      return NextResponse.json(
        { error: "Shop domain is required" },
        { status: 400 }
      );
    }

    // Validate shop domain format
    if (!validateShopDomain(shop)) {
      logApiError(
        "POST",
        "/api/shopify/connect",
        400,
        new Error("Invalid shop domain format"),
        session.user,
        {
          shop,
        }
      );
      return NextResponse.json(
        { error: "Invalid shop domain format. Use: your-shop.myshopify.com" },
        { status: 400 }
      );
    }

    // Generate Shopify authorization URL
    const { url, state, nonce } = generateShopifyAuthUrl(shop);

    logExternalApi("Shopify", "generate_auth_url", session.user, {
      shop,
      state,
      nonce,
    });

    // Get user by email
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      logAuthFailure(
        "POST",
        "/api/shopify/connect",
        session.user,
        "User not found in database"
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if shop is already connected for this user
    const existingShop = await ShopifyShop.findOne({
      userId: user._id,
      shop: shop,
    });

    // If shop exists but is incomplete (no access token), allow reconnection
    if (existingShop && existingShop.accessToken) {
      logBusinessEvent("shopify_connect_duplicate", session.user, {
        shop,
        reason: "Shop already connected",
      });
      return NextResponse.json(
        { error: "Shop is already connected to this account" },
        { status: 400 }
      );
    }

    // If incomplete connection exists, remove it to start fresh
    if (existingShop && !existingShop.accessToken) {
      await ShopifyShop.findByIdAndDelete(existingShop._id);
      logDbOperation("delete", "ShopifyShop", session.user, {
        shopId: existingShop._id.toString(),
        reason: "Remove incomplete connection for reconnection",
      });
    }

    // Create or update shop connection with OAuth state
    const shopConnection = await ShopifyShop.findOneAndUpdate(
      { userId: user._id, shop: shop },
      {
        userId: user._id,
        shop: shop,
        oauthState: state,
        oauthNonce: nonce,
        isActive: false,
        accessToken: null,
      },
      { upsert: true, new: true }
    );

    logDbOperation("upsert", "ShopifyShop", session.user, {
      shopId: shopConnection._id.toString(),
      shop,
      oauthState: state,
      isNew: !existingShop,
    });

    logBusinessEvent("shopify_connect_initiated", session.user, {
      shop,
      oauthState: state,
    });

    logApiSuccess("POST", "/api/shopify/connect", 200, session.user, {
      shop,
      authUrlGenerated: true,
    });

    return NextResponse.json({
      authUrl: url,
      state: state,
      message: "Redirect to Shopify authorization",
    });
  } catch (error) {
    logApiError("POST", "/api/shopify/connect", 500, error, session?.user, {
      shop: request.body?.shop,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
