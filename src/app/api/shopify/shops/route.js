import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import ShopifyShop from "@/models/ShopifyShop";

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

    // Clean up any incomplete connections for this user
    await ShopifyShop.deleteMany({
      userId: user._id,
      accessToken: null,
    });

    // Get all connected shops for this user
    const connectedShops = await ShopifyShop.find({
      userId: user._id,
      isActive: true,
    }).select({
      shop: 1,
      connectedAt: 1,
      webhooksRegistered: 1,
      webhookRegistrationDate: 1,
      registeredWebhooks: 1,
    });

    return NextResponse.json({
      success: true,
      data: connectedShops,
      count: connectedShops.length,
    });
  } catch (error) {
    console.error("Error fetching connected shops:", error);
    return NextResponse.json(
      { error: "Failed to fetch connected shops" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
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

    const { shop } = await request.json();

    if (!shop) {
      return NextResponse.json(
        { error: "Shop domain is required" },
        { status: 400 }
      );
    }

    // Find and deactivate the shop connection
    const shopConnection = await ShopifyShop.findOneAndUpdate(
      {
        userId: user._id,
        shop: shop,
        isActive: true,
      },
      {
        isActive: false,
      },
      { new: true }
    );

    if (!shopConnection) {
      return NextResponse.json(
        { error: "Shop connection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Shop connection deactivated successfully",
      data: shopConnection,
    });
  } catch (error) {
    console.error("Error deactivating shop connection:", error);
    return NextResponse.json(
      { error: "Failed to deactivate shop connection" },
      { status: 500 }
    );
  }
}
