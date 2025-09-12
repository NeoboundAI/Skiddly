import { NextResponse } from "next/server";
import { cartScannerQueue } from "@/lib/queue";

export async function GET() {
  try {
    console.log("🧪 Manual scan triggered via API...");

    const result = await cartScannerQueue.triggerManualScan();

    return NextResponse.json({
      success: true,
      message: "Manual cart scan completed",
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error triggering manual scan:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to trigger manual scan",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
