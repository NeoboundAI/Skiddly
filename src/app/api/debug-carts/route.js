import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AbandonedCart from "@/models/AbandonedCart";
import Call from "@/models/Call";

export async function GET(request) {
  try {
    await connectDB();

    // Get all abandoned carts
    const allCarts = await AbandonedCart.find({})
      .populate("userId", "email name")
      .lean();

    // Get all calls
    const allCalls = await Call.find({})
      .populate("abandonedCartId", "shopifyCheckoutId")
      .lean();

    return NextResponse.json({
      success: true,
      debug: {
        totalCarts: allCarts.length,
        totalCalls: allCalls.length,
        cartStages: [...new Set(allCarts.map((cart) => cart.orderStage))],
        callStatuses: [...new Set(allCalls.map((call) => call.status))],
        sampleCart: allCarts[0] || null,
        sampleCall: allCalls[0] || null,
        cartsWithNextCallTime: allCarts.filter((cart) => cart.nextCallTime)
          .length,
        callsWithNextCallTime: allCalls.filter((call) => call.nextCallTime)
          .length,
      },
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
