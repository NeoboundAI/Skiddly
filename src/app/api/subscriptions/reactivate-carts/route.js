import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb.js";
import subscriptionService from "@/services/subscriptionService.js";

/**
 * POST /api/subscriptions/reactivate-carts
 * Manually reactivate limit-reached carts for the current user
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Reactivate limit-reached carts
    const result = await subscriptionService.reactivateLimitReachedCarts(
      session.user.id
    );

    const response = {
      success: true,
      message: `Successfully reactivated ${result.reactivated} carts`,
      data: result,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error reactivating carts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reactivate carts" },
      { status: 500 }
    );
  }
}
