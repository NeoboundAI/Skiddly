import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
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

    // Find user and get Shopify credentials
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (
      !user.shopify?.isActive ||
      !user.shopify?.accessToken ||
      !user.shopify?.shop
    ) {
      return NextResponse.json(
        { error: "Shopify not connected. Please connect your store first." },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 50;

    // Fetch abandoned carts from Shopify
    const abandonedCarts = await getShopifyAbandonedCarts(
      user.shopify.shop,
      user.shopify.accessToken,
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
