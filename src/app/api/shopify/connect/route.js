import { NextResponse } from "next/server";
import { generateShopifyAuthUrl } from "@/lib/shopify";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

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

    const { shop } = await request.json();

    if (!shop) {
      return NextResponse.json(
        { error: "Shop domain is required" },
        { status: 400 }
      );
    }

    // Validate shop domain format
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    if (!shopRegex.test(shop)) {
      return NextResponse.json(
        { error: "Invalid shop domain format. Use: your-shop.myshopify.com" },
        { status: 400 }
      );
    }

    // Generate Shopify authorization URL
    const { url, state } = generateShopifyAuthUrl(shop);
    console.log("Shopify connect - URL:", url);
    console.log("Shopify connect - State:", state);
    console.log("Shopify connect - User ID:", session.user.id);
    console.log("Shopify connect - Shop:", shop);

    // Clear any existing state and store new state in user document for verification
    const user = await User.findOneAndUpdate({ email: session.user.email }, {
      "shopify.state": state,
      "shopify.shop": shop,
      "shopify.isActive": false, // Reset connection status
      "shopify.accessToken": null, // Clear any existing token
    });

    console.log("user in connect", user);

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
