import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AbandonedCart from "@/models/AbandonedCart";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 50;
    const status = searchParams.get("status");

    // Build query
    let query = {};
    if (status) {
      query.orderStage = status;
    }

    // Fetch abandoned carts with pagination
    const carts = await AbandonedCart.find(query)
      .sort({ abandonedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("userId", "email name")
      .lean();

    // Transform data to match frontend expectations
    const transformedCarts = carts.map((cart) => ({
      _id: cart._id,
      shopifyCheckoutId: cart.shopifyCheckoutId,
      customerName: cart.userId?.name || "Unknown Customer",
      customerEmail: cart.userId?.email || "unknown@email.com",
      customerPhone: cart.customerPhone || "+0000000000",
      cartValue: cart.cartValue || 0,
      items: cart.items || 0,
      customerType: cart.customerType || "NEW",
      location: cart.location || "Unknown Location",
      abandonedAt: cart.abandonedAt,
      orderStage: cart.orderStage || "waiting",
      callStage: cart.lastCallStatus || "NOT STARTED",
      callOutcome: cart.lastCallOutcome || "PENDING",
      callAttempts: cart.totalAttempts || 0,
      callEndReason: cart.lastCallStatus || "No calls made",
      lastPicked: cart.lastAttemptTime,
      callDuration: cart.lastCallDuration || null,
      totalAttempts: cart.totalAttempts || 0,
      callHistory: cart.callHistory || [],
    }));

    // Get total count
    const total = await AbandonedCart.countDocuments(query);

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
    console.error("Error fetching abandoned carts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch abandoned carts" },
      { status: 500 }
    );
  }
}
