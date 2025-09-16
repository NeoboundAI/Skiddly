import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route.js";
import subscriptionService from "@/services/subscriptionService.js";

/**
 * GET /api/subscriptions/plans
 * Get available subscription plans
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
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
