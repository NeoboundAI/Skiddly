import { NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import connectDB from "@/lib/mongodb";
import { logApiError, logApiSuccess, logBusinessEvent } from "@/lib/apiLogger";

/**
 * Append webhook data to single log file for analysis
 */
function appendWebhookToFile(webhookData, headers) {
  try {
    // Create webhooks directory if it doesn't exist
    const webhooksDir = path.join(process.cwd(), "webhook-logs");
    if (!fs.existsSync(webhooksDir)) {
      fs.mkdirSync(webhooksDir, { recursive: true });
    }

    // Use single file with current date
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const filename = `vapi-webhooks-${today}.log`;
    const filePath = path.join(webhooksDir, filename);

    // Prepare data to append
    const logEntry = {
      timestamp: new Date().toISOString(),
      callId: webhookData?.call?.id || webhookData?.id || "unknown",
      eventType: webhookData?.type || webhookData?.event || "unknown",
      headers: {
        signature: headers.signature,
        timestamp: headers.timestamp,
        userAgent: headers.userAgent,
      },
      webhook: webhookData,
    };

    // Append to file (each webhook as a new line with JSON)
    const logLine = JSON.stringify(logEntry) + "\n";
    fs.appendFileSync(filePath, logLine);

    console.log(`📄 Webhook appended to: ${filename}`);
    return filename;
  } catch (error) {
    console.error("❌ Failed to append webhook to file:", error.message);
    return null;
  }
}

/**
 * VAPI Webhook Handler
 * Receives call status updates from VAPI
 */
export async function POST(request) {
  let webhookData = null;
  let savedFile = null;

  try {
    console.log("🔔 VAPI webhook received");

    // Get the raw body for webhook verification
    const body = await request.text();

    // Get VAPI webhook headers
    const signature = request.headers.get("vapi-signature");
    const timestamp = request.headers.get("vapi-timestamp");
    const userAgent = request.headers.get("user-agent");

    console.log("📋 VAPI webhook headers:", {
      hasSignature: !!signature,
      timestamp,
      userAgent,
      bodyLength: body?.length || 0,
      bodyPreview: body?.substring(0, 200) || "empty",
    });

    // Parse the webhook payload
    try {
      if (!body || body.trim() === "") {
        console.error("Empty VAPI webhook body received");
        return NextResponse.json(
          { error: "Empty webhook body" },
          { status: 400 }
        );
      }

      webhookData = JSON.parse(body);
      console.log("📦 VAPI webhook data received:");
      console.log(JSON.stringify(webhookData, null, 2));

      // Append webhook data to log file for analysis
      savedFile = appendWebhookToFile(webhookData, {
        signature,
        timestamp,
        userAgent,
      });
      console.log(`📁 Webhook appended to: ${savedFile}`);
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      console.error("Raw body:", body);
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Verify webhook signature if secret is configured
    if (process.env.VAPI_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.VAPI_WEBHOOK_SECRET)
        .update(body)
        .digest("hex");

      const providedSignature = signature.replace("sha256=", "");

      if (expectedSignature !== providedSignature) {
        console.error("Invalid VAPI webhook signature");
        logApiError(
          "POST",
          "/api/vapi/webhooks",
          401,
          new Error("Invalid webhook signature"),
          null,
          { providedSignature: signature }
        );
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      } else {
        console.log("✅ VAPI webhook signature verified");
      }
    } else {
      console.warn(
        "⚠️ VAPI webhook signature verification skipped (no secret configured)"
      );
    }

    // Connect to database
    await connectDB();

    // Extract key information from webhook
    const callId = webhookData?.call?.id || webhookData?.id;
    const callStatus = webhookData?.call?.status || webhookData?.status;
    const eventType = webhookData?.type || webhookData?.event;

    console.log("🔍 Extracted webhook info:", {
      callId,
      callStatus,
      eventType,
      hasCall: !!webhookData?.call,
      hasMessage: !!webhookData?.message,
      hasTranscript: !!webhookData?.transcript,
    });

    // Log the webhook event for business tracking
    logBusinessEvent("vapi_webhook_received", null, {
      callId,
      callStatus,
      eventType,
      timestamp: new Date().toISOString(),
      webhookDataKeys: Object.keys(webhookData || {}),
      savedToFile: savedFile,
    });

    // TODO: Update Call record with new status
    // TODO: Update AbandonedCart with call history
    // TODO: Trigger next actions based on call outcome

    console.log("✅ VAPI webhook processed successfully (status logged only)");

    // Log successful webhook processing
    logApiSuccess("POST", "/api/vapi/webhooks", 200, null, {
      callId,
      eventType,
      callStatus,
    });

    // Return success response quickly (VAPI expects fast response)
    return NextResponse.json({
      success: true,
      message: "Webhook received and logged",
      callId,
    });
  } catch (error) {
    console.error("❌ Error processing VAPI webhook:", error.message);
    console.error("Error details:", error);

    logApiError("POST", "/api/vapi/webhooks", 500, error, null, {
      webhookDataPreview: webhookData ? Object.keys(webhookData) : null,
      errorMessage: error.message,
    });

    // Still return 200 to prevent VAPI from retrying failed webhooks
    // (we'll handle data integrity through polling)
    return NextResponse.json(
      {
        error: "Webhook processing failed",
        message: error.message,
      },
      { status: 200 } // Return 200 to prevent retries
    );
  }
}

/**
 * GET endpoint for webhook verification/testing
 */
export async function GET(request) {
  return NextResponse.json({
    status: "VAPI webhook endpoint active",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}
