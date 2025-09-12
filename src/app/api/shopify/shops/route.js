import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import ShopifyShop from "@/models/ShopifyShop";
import {
  logApiError,
  logApiSuccess,
  logAuthFailure,
  logDbOperation,
  logBusinessEvent,
} from "@/lib/apiLogger";

export async function GET(request) {
  let session;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logAuthFailure(
        "GET",
        "/api/shopify/shops",
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
        "/api/shopify/shops",
        session.user,
        "User not found in database"
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Clean up any incomplete connections for this user
    const deletedCount = await ShopifyShop.deleteMany({
      userId: user._id,
      accessToken: null,
    });

    if (deletedCount.deletedCount > 0) {
      logDbOperation("delete", "ShopifyShop", session.user, {
        operation: "cleanup_incomplete_connections",
        deletedCount: deletedCount.deletedCount,
      });
    }

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

    logDbOperation("read", "ShopifyShop", session.user, {
      operation: "fetch_connected_shops",
      count: connectedShops.length,
    });

    logApiSuccess("GET", "/api/shopify/shops", 200, session.user, {
      shopCount: connectedShops.length,
    });

    return NextResponse.json({
      success: true,
      data: connectedShops,
      count: connectedShops.length,
    });
  } catch (error) {
    logApiError("GET", "/api/shopify/shops", 500, error, session?.user);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  let session;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logAuthFailure(
        "DELETE",
        "/api/shopify/shops",
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
        "DELETE",
        "/api/shopify/shops",
        session.user,
        "User not found in database"
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { shop } = await request.json();

    if (!shop) {
      logApiError(
        "DELETE",
        "/api/shopify/shops",
        400,
        new Error("Shop domain is required"),
        session.user
      );
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
      logApiError(
        "DELETE",
        "/api/shopify/shops",
        404,
        new Error("Shop connection not found"),
        session.user,
        {
          shop,
        }
      );
      return NextResponse.json(
        { error: "Shop connection not found" },
        { status: 404 }
      );
    }

    logDbOperation("update", "ShopifyShop", session.user, {
      operation: "deactivate_shop_connection",
      shopId: shopConnection._id.toString(),
      shop,
      previousStatus: true,
      newStatus: false,
    });

    logBusinessEvent("shopify_shop_deactivated", session.user, {
      shop,
      shopId: shopConnection._id.toString(),
    });

    logApiSuccess("DELETE", "/api/shopify/shops", 200, session.user, {
      shop,
    });

    return NextResponse.json({
      success: true,
      message: "Shop connection deactivated successfully",
      data: shopConnection,
    });
  } catch (error) {
    logApiError("DELETE", "/api/shopify/shops", 500, error, session?.user);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
