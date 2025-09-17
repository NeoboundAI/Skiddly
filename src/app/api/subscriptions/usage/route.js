import { NextResponse } from "next/server";
import { auth } from "@/auth";
import subscriptionService from "@/services/subscriptionService.js";
import connectDB from "@/lib/mongodb.js";

/**
 * GET /api/subscriptions/usage
 * Get user's usage summary
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const billingPeriod = searchParams.get("billingPeriod");

    await connectDB();

    const usageSummary = await subscriptionService.getUserUsageSummary(
      session.user.id,
      billingPeriod
    );

    return NextResponse.json({
      success: true,
      data: usageSummary,
    });
  } catch (error) {
    console.error("Error getting usage summary:", error);
    return NextResponse.json(
      { error: "Failed to get usage summary" },
      { status: 500 }
    );
  }
}
