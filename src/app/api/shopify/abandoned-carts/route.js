import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import ShopifyShop from "@/models/ShopifyShop";
import { getShopifyAbandonedCarts } from "@/lib/shopify";

export async function GET(request) {
  try {
    // Get user session
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    // Find user
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
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
      return NextResponse.json(
        {
          error:
            "No active Shopify connection found. Please connect your store first.",
        },
        { status: 400 }
      );
    }

    // Fetch abandoned carts from Shopify
    const abandonedCarts = await getShopifyAbandonedCarts(
      shopConnection.shop,
      shopConnection.accessToken,
      limit
    );

    return NextResponse.json({
      success: true,
      data: abandonedCarts,
      count: abandonedCarts.length,
    });
  } catch (error) {
    console.error("Error fetching abandoned carts:", error);
    return NextResponse.json(
      { error: "Failed to fetch abandoned carts" },
      { status: 500 }
    );
  }
}
