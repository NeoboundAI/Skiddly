import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AbandonedCart from "@/models/AbandonedCart";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 50;

    // Find carts that are waiting to be abandoned or scheduled for retry
    const query = {
      $or: [
        { orderStage: { $in: ["waiting", "pending", "new"] } },
        { orderStage: "retry-scheduled" },
        { orderStage: "abandoned" },
      ],
    };

    const carts = await AbandonedCart.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("userId", "email name")
      .lean();

    console.log("Waiting carts query:", JSON.stringify(query, null, 2));
    console.log("Found waiting carts:", carts.length);

    // Transform data to match frontend expectations
    const transformedCarts = carts.map((cart) => ({
      _id: cart._id,
      shopifyCheckoutId: cart.shopifyCheckoutId,
      customerName: cart.userId?.name || "Unknown Customer",
      customerPhone: cart.customerPhone || "+0000000000",
      cartValue: cart.cartValue || 0,
      items: cart.items || 0,
      createdAt: cart.createdAt,
      nextCallTime: cart.nextCallTime,
      orderStage: cart.orderStage || "waiting",
    }));

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
    console.error("Error fetching waiting carts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch waiting carts" },
      { status: 500 }
    );
  }
}
