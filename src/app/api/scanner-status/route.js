import { NextResponse } from "next/server";
import { getAllQueuesStatus } from "@/lib/queue";

export async function GET() {
  try {
    const status = getAllQueuesStatus();

    console.log("🔍 Queue Services Status:", status);

    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error getting queue services status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get queue services status",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
