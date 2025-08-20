import { NextResponse } from "next/server";
import { generateShopifyAuthUrl, validateShopDomain } from "@/lib/shopify";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import ShopifyShop from "@/models/ShopifyShop";

export async function POST(request) {
  try {
    // Verify authentication using NextAuth session
    const session = await getServerSession();
    console.log("session in connect", session);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    // Clean up old incomplete connections (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    await ShopifyShop.deleteMany({
      accessToken: null,
      createdAt: { $lt: oneHourAgo },
    });

    const { shop } = await request.json();

    if (!shop) {
      return NextResponse.json(
        { error: "Shop domain is required" },
        { status: 400 }
      );
    }

    // Validate shop domain format
    if (!validateShopDomain(shop)) {
      return NextResponse.json(
        { error: "Invalid shop domain format. Use: your-shop.myshopify.com" },
        { status: 400 }
      );
    }

    // Generate Shopify authorization URL
    const { url, state, nonce } = generateShopifyAuthUrl(shop);
    console.log("Shopify connect - URL:", url);
    console.log("Shopify connect - State:", state);
    console.log("Shopify connect - User ID:", session.user.id);
    console.log("Shopify connect - Shop:", shop);

    // Get user by email
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if shop is already connected for this user
    const existingShop = await ShopifyShop.findOne({
      userId: user._id,
      shop: shop,
    });

    // If shop exists but is incomplete (no access token), allow reconnection
    if (existingShop && existingShop.accessToken) {
      return NextResponse.json(
        { error: "Shop is already connected to this account" },
        { status: 400 }
      );
    }

    // If incomplete connection exists, remove it to start fresh
    if (existingShop && !existingShop.accessToken) {
      console.log("Removing incomplete shop connection for reconnection");
      await ShopifyShop.findByIdAndDelete(existingShop._id);
    }

    // Create or update shop connection with OAuth state
    await ShopifyShop.findOneAndUpdate(
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

    console.log("Shop connection created/updated for user:", user._id);

    return NextResponse.json({
      authUrl: url,
      state: state,
      message: "Redirect to Shopify authorization",
    });
  } catch (error) {
    console.error("Shopify connect error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
