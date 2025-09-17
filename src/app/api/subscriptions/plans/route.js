import { NextResponse } from "next/server";
import { auth } from "@/auth";
import subscriptionService from "@/services/subscriptionService.js";

/**
 * GET /api/subscriptions/plans
 * Get available subscription plans
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plans = subscriptionService.getPlanComparison();

    return NextResponse.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("Error getting plans:", error);
    return NextResponse.json(
      { error: "Failed to get subscription plans" },
      { status: 500 }
    );
  }
}
