import { NextResponse } from "next/server";
import { auth } from "@/auth";
import subscriptionService from "@/services/subscriptionService.js";
import connectDB from "@/lib/mongodb.js";

/**
 * GET /api/subscriptions
 * Get user's current subscription details
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const subscription = await subscriptionService.getUserSubscription(
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error("Error getting subscription:", error);
    return NextResponse.json(
      { error: "Failed to get subscription details" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions
 * Upgrade user's subscription plan
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, upgradeReason } = await request.json();

    if (!plan) {
      return NextResponse.json({ error: "Plan is required" }, { status: 400 });
    }

    await connectDB();

    const userPlan = await subscriptionService.upgradePlan(
      session.user.id,
      plan,
      upgradeReason
    );

    return NextResponse.json({
      success: true,
      message: "Plan upgraded successfully",
      data: userPlan,
    });
  } catch (error) {
    console.error("Error upgrading plan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upgrade plan" },
      { status: 500 }
    );
  }
}
