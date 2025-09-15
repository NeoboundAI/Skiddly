import { NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import connectDB from "@/lib/mongodb";
import Call from "@/models/Call";
import AbandonedCart from "@/models/AbandonedCart";
import Agent from "@/models/Agent";
import {
  logApiError,
  logApiSuccess,
  logBusinessEvent,
  logDbOperation,
} from "@/lib/apiLogger";

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
      // console.log("📦 VAPI webhook data received:");
      // console.log(JSON.stringify(webhookData, null, 2));

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
    const callId =
      webhookData?.call?.id ||
      webhookData?.message?.call?.id ||
      webhookData?.id;
    const callStatus =
      webhookData?.call?.status ||
      webhookData?.message?.status ||
      webhookData?.status;
    const eventType =
      webhookData?.type || webhookData?.message?.type || webhookData?.event;

    console.log(
      `🔍 VAPI Webhook: ${eventType} | Call: ${callId} | Status: ${callStatus}`
    );
    // console.log("🔍 Extracted webhook info:", {
    //   callId,
    //   callStatus,
    //   eventType,
    //   hasCall: !!webhookData?.call,
    //   hasMessage: !!webhookData?.message,
    //   hasTranscript: !!webhookData?.transcript,
    //   webhookDataKeys: Object.keys(webhookData || {}),
    //   messageKeys: webhookData?.message
    //     ? Object.keys(webhookData.message)
    //     : null,
    // });

    // Log the webhook event for business tracking
    logBusinessEvent("vapi_webhook_received", null, {
      callId,
      callStatus,
      eventType,
      timestamp: new Date().toISOString(),
      webhookDataKeys: Object.keys(webhookData || {}),
      savedToFile: savedFile,
    });

    // Process the webhook data and update database records
    await processVapiWebhook(webhookData, callId, callStatus, eventType);

    console.log("✅ VAPI webhook processed successfully");

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
 * Process VAPI webhook data and update database records
 */
async function processVapiWebhook(webhookData, callId, callStatus, eventType) {
  try {
    console.log(
      `🔄 Processing VAPI webhook for call: ${callId}, event: ${eventType}`
    );

    // Find the Call record by callId
    const callRecord = await Call.findOne({ callId: callId });
    if (!callRecord) {
      console.log(`⚠️ Call record not found for callId: ${callId}`);
      return;
    }

    console.log(`📞 Found call record: ${callRecord._id}`);

    // Update Call record with webhook data
    const callUpdateData = {
      updatedAt: new Date(),
    };

    // Update status if provided
    if (callStatus) {
      callUpdateData.status = callStatus;

      // Set picked status when call goes to in-progress
      if (callStatus === "in-progress") {
        callUpdateData.picked = true;
      }
    }

    // Update specific fields based on webhook type
    if (eventType === "end-of-call-report") {
      // Handle nested webhook data structure
      const callData = webhookData.message || webhookData;

      if (callData.endedReason) {
        callUpdateData.endedReason = callData.endedReason;

        // Categorize and handle different ended reasons
        const reasonCategory = categorizeEndedReason(callData.endedReason);

        // Get agent retry intervals for proper scheduling
        let agentRetryIntervals = [];
        if (callRecord.agentId) {
          const agent = await Agent.findById(callRecord.agentId);
          if (agent && agent.callLogic && agent.callLogic.callSchedule) {
            if (agent.callLogic.callSchedule.retryIntervals) {
              agentRetryIntervals = agent.callLogic.callSchedule.retryIntervals;
            }
          }
        }

        // Get current attempt count from AbandonedCart
        const abandonedCart = await AbandonedCart.findById(
          callRecord.abandonedCartId
        );
        const currentAttempts = abandonedCart
          ? (abandonedCart.totalAttempts || 0) + 1
          : 1;

        // Set picked status and next call time based on reason category
        if (reasonCategory === "customer_answered") {
          callUpdateData.picked = true;
          callUpdateData.nextCallTime = null; // No retry needed
        } else if (reasonCategory === "assistant_ended") {
          callUpdateData.picked = true; // Customer was engaged, assistant ended
          callUpdateData.nextCallTime = null; // No retry needed
        } else {
          // For all other cases, use agent retry intervals
          callUpdateData.picked = false;
          callUpdateData.nextCallTime = calculateNextCallTime(
            currentAttempts,
            agentRetryIntervals,
            callData.endedReason
          );
        }

        // Log detailed reason information
        console.log(
          `📞 Call ended: ${callData.endedReason} | Category: ${reasonCategory} | Attempt: ${currentAttempts} | Picked: ${callUpdateData.picked} | Next call: ${callUpdateData.nextCallTime}`
        );
      }
      if (callData.cost !== undefined) {
        callUpdateData.cost = callData.cost;
      }
      if (callData.duration !== undefined) {
        callUpdateData.duration = callData.duration;
      }
      if (callData.transcript) {
        callUpdateData.transcript = callData.transcript;
      }
      if (callData.summary) {
        callUpdateData.summary = callData.summary;
      }
      if (callData.recordingUrl) {
        callUpdateData.recordingUrl = callData.recordingUrl;
      }
    }

    // Update the Call record
    const updatedCall = await Call.findByIdAndUpdate(
      callRecord._id,
      callUpdateData,
      { new: true }
    );

    console.log(`✅ Updated Call record: ${updatedCall._id}`);

    // Update AbandonedCart with call history
    await updateAbandonedCartWithCallHistory(
      callRecord.abandonedCartId,
      callId,
      webhookData,
      eventType,
      callStatus
    );

    logDbOperation("UPDATE", "Call", callRecord._id, null, {
      webhookEvent: eventType,
      callStatus: callStatus,
      endedReason: (webhookData.message || webhookData).endedReason,
      reasonCategory: (webhookData.message || webhookData).endedReason
        ? categorizeEndedReason(
            (webhookData.message || webhookData).endedReason
          )
        : null,
      nextCallTime: callUpdateData.nextCallTime,
      picked: callUpdateData.picked,
    });
  } catch (error) {
    console.error(
      `❌ Error processing VAPI webhook for call ${callId}:`,
      error.message
    );
    logApiError("VAPI_WEBHOOK", "process_webhook", 500, error, null, {
      callId,
      eventType,
      errorMessage: error.message,
    });
  }
}

/**
 * Update AbandonedCart with call history
 */
async function updateAbandonedCartWithCallHistory(
  abandonedCartId,
  callId,
  webhookData,
  eventType,
  callStatus
) {
  try {
    console.log(
      `🛒 Updating AbandonedCart ${abandonedCartId} with call history`
    );

    const abandonedCart = await AbandonedCart.findById(abandonedCartId);
    if (!abandonedCart) {
      console.log(`⚠️ AbandonedCart not found: ${abandonedCartId}`);
      return;
    }

    // Get agent retry intervals and max retries from the call record
    let agentRetryIntervals = [];
    let maxRetries = 6; // Default fallback
    const callRecord = await Call.findOne({ callId: callId });
    if (callRecord && callRecord.agentId) {
      const agent = await Agent.findById(callRecord.agentId);
      if (agent && agent.callLogic && agent.callLogic.callSchedule) {
        if (agent.callLogic.callSchedule.retryIntervals) {
          agentRetryIntervals = agent.callLogic.callSchedule.retryIntervals;
        }
        if (agent.callLogic.callSchedule.maxRetries) {
          maxRetries = agent.callLogic.callSchedule.maxRetries;
        }
        console.log(
          `📋 Found agent config: ${agentRetryIntervals.length} retry intervals, maxRetries: ${maxRetries}`
        );
      }
    }

    // Find existing call history entry or create new one
    let callHistoryEntry = abandonedCart.callHistory.find(
      (entry) => entry.callId === callId
    );

    if (!callHistoryEntry) {
      // Create new call history entry
      callHistoryEntry = {
        callId: callId,
        timestamp: new Date(),
        status: [],
        outcome: null,
        duration: 0,
        nextAction: null,
        nextActionTime: null,
        callStats: {
          transcript: null,
          summary: null,
          recordingUrl: null,
          analysis: null,
          ended_reason: null,
        },
      };
      abandonedCart.callHistory.push(callHistoryEntry);
    }

    // Update call history based on webhook type
    if (eventType === "status-update") {
      // Add status to the status array if not already present
      if (callStatus && !callHistoryEntry.status.includes(callStatus)) {
        callHistoryEntry.status.push(callStatus);
      }
    }

    if (eventType === "end-of-call-report") {
      // Handle nested webhook data structure
      const callData = webhookData.message || webhookData;

      // Update final call details
      if (callData.endedReason) {
        callHistoryEntry.callStats.ended_reason = callData.endedReason;

        // Determine outcome based on ended reason
        if (callData.endedReason === "customer-ended-call") {
          callHistoryEntry.outcome = "not-interested";
          callHistoryEntry.nextAction = "complete";
          callHistoryEntry.nextActionTime = new Date(
            Date.now() + 5 * 60 * 1000
          ); // 5 minutes from now
        } else if (callData.endedReason === "customer-busy") {
          callHistoryEntry.outcome = "busy";
          callHistoryEntry.nextAction = "reschedule";
          // Calculate next call time based on agent retry intervals
          const nextAttempt = abandonedCart.totalAttempts + 1;
          callHistoryEntry.nextActionTime = calculateNextCallTime(
            nextAttempt,
            agentRetryIntervals,
            callData.endedReason
          );
        } else if (callData.endedReason === "customer-did-not-answer") {
          callHistoryEntry.outcome = "no-answer";
          callHistoryEntry.nextAction = "reschedule";
          // Calculate next call time based on agent retry intervals
          const nextAttempt = abandonedCart.totalAttempts + 1;
          callHistoryEntry.nextActionTime = calculateNextCallTime(
            nextAttempt,
            agentRetryIntervals,
            callData.endedReason
          );
        } else {
          // Handle other ended reasons
          callHistoryEntry.outcome = "failed";
          callHistoryEntry.nextAction = "reschedule";
          // Calculate next call time based on agent retry intervals
          const nextAttempt = abandonedCart.totalAttempts + 1;
          callHistoryEntry.nextActionTime = calculateNextCallTime(
            nextAttempt,
            agentRetryIntervals,
            callData.endedReason
          );
        }
      }

      if (callData.duration !== undefined) {
        callHistoryEntry.duration = callData.duration;
      }

      if (callData.transcript) {
        callHistoryEntry.callStats.transcript = callData.transcript;
      }

      if (callData.summary) {
        callHistoryEntry.callStats.summary = callData.summary;
      }

      if (callData.recordingUrl) {
        callHistoryEntry.callStats.recordingUrl = callData.recordingUrl;
      }

      if (callData.analysis) {
        callHistoryEntry.callStats.analysis = callData.analysis;
      }
    }

    // Update AbandonedCart fields
    const newTotalAttempts = abandonedCart.totalAttempts + 1;
    const hasReachedMaxRetries = newTotalAttempts >= maxRetries;

    const updateData = {
      callHistory: abandonedCart.callHistory,
      totalAttempts: newTotalAttempts,
      lastAttemptTime: new Date(),
    };

    // Update last call status and outcome
    if (callHistoryEntry.outcome) {
      updateData.lastCallOutcome = callHistoryEntry.outcome;
      updateData.lastCallStatus = callStatus;

      if (callHistoryEntry.outcome === "not-interested") {
        updateData.orderStage = "not-interested";
        updateData.nextAttemptShouldBeMade = false;
        updateData.finalAction = "customer-not-interested";
        updateData.nextCallTime = null;
      } else if (hasReachedMaxRetries) {
        updateData.orderStage = "max-retries-reached";
        updateData.nextAttemptShouldBeMade = false;
        updateData.finalAction = "max-retries-exceeded";
        updateData.nextCallTime = null;
      } else if (
        callHistoryEntry.outcome === "busy" ||
        callHistoryEntry.outcome === "no-answer" ||
        callHistoryEntry.outcome === "failed"
      ) {
        updateData.orderStage = "retry-scheduled";
        updateData.nextAttemptShouldBeMade = true;
        updateData.nextCallTime = callHistoryEntry.nextActionTime;
      } else {
        updateData.orderStage = "retry-scheduled";
        updateData.nextAttemptShouldBeMade = true;
        updateData.nextCallTime = callHistoryEntry.nextActionTime;
      }
    }

    // Update the AbandonedCart
    const updatedAbandonedCart = await AbandonedCart.findByIdAndUpdate(
      abandonedCartId,
      updateData,
      { new: true }
    );

    console.log(`✅ Updated AbandonedCart: ${updatedAbandonedCart._id}`);

    logDbOperation("UPDATE", "AbandonedCart", abandonedCartId, null, {
      callId,
      eventType,
      outcome: callHistoryEntry.outcome,
      totalAttempts: updateData.totalAttempts,
      maxRetries: maxRetries,
      hasReachedMaxRetries: hasReachedMaxRetries,
      nextCallTime: updateData.nextCallTime,
      nextAttemptShouldBeMade: updateData.nextAttemptShouldBeMade,
      orderStage: updateData.orderStage,
    });
  } catch (error) {
    console.error(
      `❌ Error updating AbandonedCart ${abandonedCartId}:`,
      error.message
    );
    logApiError("VAPI_WEBHOOK", "update_abandoned_cart", 500, error, null, {
      abandonedCartId,
      callId,
      eventType,
      errorMessage: error.message,
    });
  }
}

/**
 * Calculate next call time based on agent's retry intervals
 */
function calculateNextCallTime(
  totalAttempts,
  agentRetryIntervals,
  endedReason
) {
  // If customer ended call or assistant ended call, no retry needed
  if (
    endedReason === "customer-ended-call" ||
    endedReason?.startsWith("assistant-ended-call")
  ) {
    return null;
  }

  // Find the retry interval for the current attempt
  const retryInterval = agentRetryIntervals.find(
    (interval) => interval.attempt === totalAttempts
  );

  if (!retryInterval) {
    // If no specific interval found, use default based on ended reason
    if (endedReason === "customer-busy") {
      return new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    } else if (endedReason === "customer-did-not-answer") {
      return new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    } else {
      return new Date(Date.now() + 30 * 60 * 1000); // 30 minutes default
    }
  }

  // Calculate delay based on unit
  let delayMs = 0;
  switch (retryInterval.delayUnit) {
    case "minutes":
      delayMs = retryInterval.delay * 60 * 1000;
      break;
    case "hours":
      delayMs = retryInterval.delay * 60 * 60 * 1000;
      break;
    case "days":
      delayMs = retryInterval.delay * 24 * 60 * 60 * 1000;
      break;
    default:
      delayMs = retryInterval.delay * 60 * 1000; // Default to minutes
  }

  return new Date(Date.now() + delayMs);
}

/**
 * Categorize VAPI ended reasons for better handling
 */
function categorizeEndedReason(endedReason) {
  if (!endedReason) return "unknown";

  // Customer answered and engaged
  if (endedReason === "customer-ended-call") {
    return "customer_answered";
  }

  // Customer line was busy
  if (endedReason === "customer-busy") {
    return "customer_busy";
  }

  // Customer didn't answer
  if (endedReason === "customer-did-not-answer") {
    return "customer_no_answer";
  }

  // Assistant intentionally ended the call
  if (
    endedReason.startsWith("assistant-ended-call") ||
    endedReason === "assistant-ended-call" ||
    endedReason === "assistant-ended-call-after-message-spoken" ||
    endedReason === "assistant-ended-call-with-hangup-task"
  ) {
    return "assistant_ended";
  }

  // Voicemail
  if (endedReason === "voicemail") {
    return "voicemail";
  }

  // Technical errors
  if (
    endedReason.startsWith("assistant-error") ||
    endedReason.startsWith("assistant-request-failed") ||
    endedReason.startsWith("assistant-request-returned") ||
    endedReason.startsWith("pipeline-error") ||
    endedReason.startsWith("call.in-progress.error") ||
    endedReason.startsWith("call-start-error") ||
    endedReason === "database-error" ||
    endedReason === "assistant-not-found" ||
    endedReason === "assistant-not-valid" ||
    endedReason === "assistant-not-provided" ||
    endedReason === "assistant-join-timed-out" ||
    endedReason === "unknown-error"
  ) {
    return "technical_error";
  }

  // Phone/Connectivity issues
  if (
    endedReason.startsWith("twilio-") ||
    endedReason.startsWith("vonage-") ||
    endedReason.startsWith("phone-call-provider") ||
    endedReason.startsWith("call.in-progress.error-sip") ||
    endedReason === "customer-did-not-give-microphone-permission" ||
    endedReason ===
      "call.in-progress.error-assistant-did-not-receive-customer-audio"
  ) {
    return "connectivity_error";
  }

  // Call limits/timeouts
  if (
    endedReason === "exceeded-max-duration" ||
    endedReason === "silence-timed-out" ||
    endedReason === "manually-canceled" ||
    endedReason === "worker-shutdown"
  ) {
    return "call_limits";
  }

  // Call forwarding
  if (
    endedReason === "assistant-forwarded-call" ||
    endedReason === "assistant-request-returned-forwarding-phone-number" ||
    endedReason.startsWith("call.forwarding") ||
    endedReason.startsWith("call.ringing.hook")
  ) {
    return "call_forwarding";
  }

  // Default for unknown reasons
  return "unknown";
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
