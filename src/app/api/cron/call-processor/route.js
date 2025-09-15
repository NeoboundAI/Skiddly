import { NextResponse } from "next/server";
import callQueueProcessor from "@/lib/queue/CallQueueProcessor";

/**
 * Vercel Cron Job for Call Queue Processor
 * This endpoint will be called by Vercel's cron service
 *
 * To set up in vercel.json:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/call-processor",
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

    console.log("📞 Vercel Cron: Starting call processor...");

    // Trigger the call processor manually
    const result = await callQueueProcessor.triggerManualProcess();

    return NextResponse.json({
      success: true,
      message: "Call processor completed",
      result: result,
    });
  } catch (error) {
    console.error("❌ Call processor cron job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
