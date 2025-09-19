import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Cart from "@/models/Cart";
import User from "@/models/User";
import {
  logApiError,
  logApiSuccess,
  logAuthFailure,
  logDbOperation,
} from "@/lib/apiLogger";

export async function GET(request) {
  let session;

  try {
    // Get user session
    session = await auth();

    if (!session?.user?.email) {
      logAuthFailure(
        "GET",
        "/api/waiting-carts",
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
        "/api/waiting-carts",
        session.user,
        "User not found in database"
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 50;

    // Find carts that are currently in checkout (waiting to be abandoned)
    const query = {
      userId: user._id,
      status: "inCheckout",
    };

    const carts = await Cart.find(query)
      .sort({ lastActivityAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    console.log("Waiting carts query:", JSON.stringify(query, null, 2));
    console.log("Found waiting carts:", carts.length);

    // Transform data to match frontend expectations
    const transformedCarts = carts.map((cart) => ({
      _id: cart._id,
      shopifyCheckoutId: cart.shopifyCheckoutId,
      customerName:
        cart.customerFirstName && cart.customerLastName
          ? `${cart.customerFirstName} ${cart.customerLastName}`
          : "Unknown Customer",
      customerEmail: cart.customerEmail || "unknown@email.com",
      customerPhone: cart.customerPhone || "+0000000000",
      cartValue: parseFloat(cart.totalPrice || 0),
      currency: cart.currency || "USD",
      items: cart.lineItems?.length || 0,
      itemDetails:
        cart.lineItems?.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          price: parseFloat(item.price || 0),
        })) || [],
      location: {
        city: cart.shippingAddress?.city || "Unknown",
        state: cart.shippingAddress?.province || "Unknown",
        country: cart.shippingAddress?.country || "Unknown",
      },
      createdAt: cart.createdAt,
      lastActivityAt: cart.lastActivityAt,
      shopifyCreatedAt: cart.shopifyCreatedAt,
      shopifyUpdatedAt: cart.shopifyUpdatedAt,
      status: cart.status,
      abandonedCheckoutUrl: cart.abandonedCheckoutUrl,
      discountCodes: cart.discountCodes,
      shippingLines: cart.shippingLines,
      // Full cart data
      cart: cart,
    }));

    const total = await Cart.countDocuments(query);

    logDbOperation("read", "Cart", session.user, {
      operation: "fetch_waiting_carts",
      count: transformedCarts.length,
      total: total,
      page: page,
      limit: limit,
    });

    logApiSuccess("GET", "/api/waiting-carts", 200, session.user, {
      cartCount: transformedCarts.length,
      total: total,
      page: page,
      limit: limit,
    });

    return NextResponse.json({
      success: true,
      carts: transformedCarts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching waiting carts:", error);

    logApiError("GET", "/api/waiting-carts", 500, error, session?.user, {
      page: new URL(request.url).searchParams.get("page"),
      limit: new URL(request.url).searchParams.get("limit"),
    });

    return NextResponse.json(
      { success: false, error: "Failed to fetch waiting carts" },
      { status: 500 }
    );
  }
}
