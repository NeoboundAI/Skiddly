import { NextResponse } from "next/server";
import cartScannerQueue from "@/lib/queue/CartScannerQueue";

/**
 * Vercel Cron Job for Cart Scanner
 * This endpoint will be called by Vercel's cron service
 *
 * To set up in vercel.json:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/cart-scanner",
 *       "schedule": "every 5 minutes"
 *     }
 *   ]
 * }
 */
export async function GET(request) {
  try {
    // Verify this is a legitimate cron request from Vercel
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🛒 Vercel Cron: Starting cart scanner...");

    // Trigger the cart scanner manually
    const result = await cartScannerQueue.triggerManualScan();

    return NextResponse.json({
      success: true,
      message: "Cart scanner completed",
      result: result,
    });
  } catch (error) {
    console.error("❌ Cart scanner cron job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
