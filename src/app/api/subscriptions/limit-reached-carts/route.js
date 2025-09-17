import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb.js";
import Cart from "@/models/Cart.js";

/**
 * GET /api/subscriptions/limit-reached-carts
 * Get carts that were marked with limit-related statuses
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find carts with limit-related statuses
    const limitReachedCarts = await Cart.find({
      userId: session.user.id,
      status: {
        $in: [
          "subscription_inactive",
          "billing_period_expired",
          "abandoned_call_limit_reached",
        ],
      },
    }).select(
      "shopifyCheckoutId status statusReason lastActivityAt totalPrice customerEmail createdAt"
    );

    const response = {
      success: true,
      data: {
        carts: limitReachedCarts,
        count: limitReachedCarts.length,
        statuses: {
          subscription_inactive: limitReachedCarts.filter(
            (c) => c.status === "subscription_inactive"
          ).length,
          billing_period_expired: limitReachedCarts.filter(
            (c) => c.status === "billing_period_expired"
          ).length,
          abandoned_call_limit_reached: limitReachedCarts.filter(
            (c) => c.status === "abandoned_call_limit_reached"
          ).length,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting limit-reached carts:", error);
    return NextResponse.json(
      { error: "Failed to get limit-reached carts" },
      { status: 500 }
    );
  }
}
