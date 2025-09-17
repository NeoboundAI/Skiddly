import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb.js";
import User from "@/models/User.js";
import Cart from "@/models/Cart.js";

/**
 * GET /api/subscriptions/usage-status
 * Get user's current usage status and billing period info
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get user with subscription info
    const user = await User.findById(session.user.id).select("subscription");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const usage = user.subscription.currentPeriodUsage.abandonedCallsUsed;
    const limit = user.subscription.currentBillingPeriod.maxAbandonedCalls;
    const periodStart = user.subscription.currentBillingPeriod.startDate;
    const periodEnd = user.subscription.currentBillingPeriod.endDate;

    const percentage = limit === -1 ? 0 : (usage / limit) * 100;
    const approaching = percentage >= 80;

    // Get count of limit-reached carts
    const limitReachedCartsCount = await Cart.countDocuments({
      userId: session.user.id,
      status: {
        $in: [
          "subscription_inactive",
          "billing_period_expired",
          "abandoned_call_limit_reached",
        ],
      },
    });

    const response = {
      success: true,
      data: {
        abandonedCallsUsed: usage,
        abandonedCallsLimit: limit,
        percentage: Math.round(percentage),
        approaching,
        remaining: limit === -1 ? -1 : limit - usage,
        periodStart,
        periodEnd,
        isTrial: user.subscription.currentBillingPeriod.isTrial,
        plan: user.subscription.plan,
        status: user.subscription.status,
        isPeriodActive: new Date() >= periodStart && new Date() <= periodEnd,
        limitReachedCartsCount,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting usage status:", error);
    return NextResponse.json(
      { error: "Failed to get usage status" },
      { status: 500 }
    );
  }
}
