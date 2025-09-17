import { NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import connectDB from "@/lib/mongodb";
import Call from "@/models/Call";
import AbandonedCart from "@/models/AbandonedCart";
import Agent from "@/models/Agent";
import CallQueue from "@/models/CallQueue";
import ProcessedCallQueue from "@/models/ProcessedCallQueue";
import User from "@/models/User";
import {
  logApiError,
  logApiSuccess,
  logBusinessEvent,
  logDbOperation,
} from "@/lib/apiLogger";
import { CALL_STATUS, ORDER_QUEUE_STATUS } from "@/constants/callConstants.js";

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
      callUpdateData.callStatus = callStatus;

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
        // Store raw provider reason
        callUpdateData.providerEndReason = callData.endedReason;
        // Store processed reason (same for now, but can be standardized later)
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

      // Set call outcome and final action based on ended reason
      if (callData.endedReason) {
        const reasonCategory = categorizeEndedReason(callData.endedReason);

        // Set call outcome and status based on reason category
        if (reasonCategory === "customer_answered") {
          callUpdateData.callOutcome = "not_interested"; // Default for customer ending call
          callUpdateData.callStatus = CALL_STATUS.PICKED;
          callUpdateData.picked = true;
        } else if (reasonCategory === "customer_busy") {
          callUpdateData.callOutcome = "customer_busy";
          callUpdateData.callStatus = CALL_STATUS.NOT_PICKED;
          callUpdateData.picked = false;
        } else if (reasonCategory === "customer_no_answer") {
          callUpdateData.callOutcome = "no_answer";
          callUpdateData.callStatus = CALL_STATUS.NOT_PICKED;
          callUpdateData.picked = false;
        } else if (reasonCategory === "voicemail") {
          callUpdateData.callOutcome = "voicemail";
          callUpdateData.callStatus = CALL_STATUS.NOT_PICKED;
          callUpdateData.picked = false;
        } else if (reasonCategory === "technical_error") {
          callUpdateData.callOutcome = "technical_issues";
          callUpdateData.callStatus = CALL_STATUS.NOT_PICKED;
          callUpdateData.picked = false;
        } else {
          callUpdateData.callOutcome = "call_disconnected"; // Default fallback
          callUpdateData.callStatus = CALL_STATUS.NOT_PICKED;
          callUpdateData.picked = false;
        }

        // Set final action based on outcome
        if (callUpdateData.callOutcome === "not_interested") {
          callUpdateData.finalAction = "no_action_required";
        } else if (
          callUpdateData.callOutcome === "customer_busy" ||
          callUpdateData.callOutcome === "no_answer" ||
          callUpdateData.callOutcome === "voicemail"
        ) {
          callUpdateData.finalAction = "scheduled_retry";
        } else {
          callUpdateData.finalAction = "scheduled_retry"; // Default for retryable cases
        }
      }
    }

    // Update the Call record
    const updatedCall = await Call.findByIdAndUpdate(
      callRecord._id,
      callUpdateData,
      { new: true }
    );

    console.log(`✅ Updated Call record: ${updatedCall._id}`);

    // Update AbandonedCart with basic call information
    await updateAbandonedCartWithCallInfo(
      callRecord.abandonedCartId,
      callId,
      webhookData,
      eventType,
      callStatus
    );

    // Update billing period usage for abandoned calls
    await updateBillingPeriodUsage(
      callRecord.userId,
      callRecord.abandonedCartId
    );

    // Move completed call queue entry to ProcessedCallQueue
    await moveCallQueueToProcessed(callId, callRecord, webhookData, eventType);

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
 * Update AbandonedCart with basic call information (no transcript/summary)
 */
async function updateAbandonedCartWithCallInfo(
  abandonedCartId,
  callId,
  webhookData,
  eventType,
  callStatus
) {
  try {
    console.log(`🛒 Updating AbandonedCart ${abandonedCartId} with call info`);

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

    // Update AbandonedCart fields
    const newTotalAttempts = abandonedCart.totalAttempts + 1;
    const hasReachedMaxRetries = newTotalAttempts >= maxRetries;

    const updateData = {
      totalAttempts: newTotalAttempts,
      lastAttemptTime: new Date(),
      lastCallStatus: callStatus,
    };

    // Update based on webhook type
    if (eventType === "end-of-call-report") {
      const callData = webhookData.message || webhookData;

      if (callData.endedReason) {
        // Determine outcome and status based on ended reason
        let outcome = null;
        let callStatus = null;
        let nextAction = null;
        let nextActionTime = null;

        if (callData.endedReason === "customer-ended-call") {
          outcome = "not_interested";
          callStatus = CALL_STATUS.PICKED;
          nextAction = "complete";
          nextActionTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
        } else if (callData.endedReason === "customer-busy") {
          outcome = "customer_busy";
          callStatus = CALL_STATUS.NOT_PICKED;
          nextAction = "reschedule";
          const nextAttempt = abandonedCart.totalAttempts + 1;
          nextActionTime = calculateNextCallTime(
            nextAttempt,
            agentRetryIntervals,
            callData.endedReason
          );
        } else if (callData.endedReason === "customer-did-not-answer") {
          outcome = "no_answer";
          callStatus = CALL_STATUS.NOT_PICKED;
          nextAction = "reschedule";
          const nextAttempt = abandonedCart.totalAttempts + 1;
          nextActionTime = calculateNextCallTime(
            nextAttempt,
            agentRetryIntervals,
            callData.endedReason
          );
        } else {
          outcome = "call_disconnected";
          callStatus = CALL_STATUS.NOT_PICKED;
          nextAction = "reschedule";
          const nextAttempt = abandonedCart.totalAttempts + 1;
          nextActionTime = calculateNextCallTime(
            nextAttempt,
            agentRetryIntervals,
            callData.endedReason
          );
        }

        // Update the call status in updateData
        updateData.lastCallStatus = callStatus;

        updateData.lastCallOutcome = outcome;
        updateData.providerEndReason = callData.endedReason;
        updateData.callEndingReason = callData.endedReason;

        // Determine final action based on outcome
        if (outcome === "not_interested") {
          updateData.nextAttemptShouldBeMade = false;
          updateData.finalAction = "no_action_required";
          updateData.nextCallTime = null;
          updateData.orderQueueStatus = ORDER_QUEUE_STATUS.COMPLETED;
        } else if (hasReachedMaxRetries) {
          updateData.nextAttemptShouldBeMade = false;
          updateData.finalAction = "no_action_required";
          updateData.nextCallTime = null;
          updateData.orderQueueStatus = ORDER_QUEUE_STATUS.COMPLETED;
        } else if (
          outcome === "customer_busy" ||
          outcome === "no_answer" ||
          outcome === "call_disconnected"
        ) {
          updateData.nextAttemptShouldBeMade = true;
          updateData.finalAction = "scheduled_retry";
          updateData.nextCallTime = nextActionTime;
          updateData.orderQueueStatus = ORDER_QUEUE_STATUS.PENDING;

          // Create new CallQueue entry for retry
          await createRetryCallQueueEntry(
            abandonedCart,
            callRecord,
            nextActionTime,
            newTotalAttempts
          );
        } else {
          updateData.nextAttemptShouldBeMade = true;
          updateData.finalAction = "scheduled_retry";
          updateData.nextCallTime = nextActionTime;
          updateData.orderQueueStatus = ORDER_QUEUE_STATUS.PENDING;

          // Create new CallQueue entry for retry
          await createRetryCallQueueEntry(
            abandonedCart,
            callRecord,
            nextActionTime,
            newTotalAttempts
          );
        }
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
      outcome: updateData.lastCallOutcome,
      totalAttempts: updateData.totalAttempts,
      maxRetries: maxRetries,
      hasReachedMaxRetries: hasReachedMaxRetries,
      nextCallTime: updateData.nextCallTime,
      nextAttemptShouldBeMade: updateData.nextAttemptShouldBeMade,
      finalAction: updateData.finalAction,
      orderQueueStatus: updateData.orderQueueStatus,
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
 * Move completed call queue entry to ProcessedCallQueue
 */
async function moveCallQueueToProcessed(
  callId,
  callRecord,
  webhookData,
  eventType
) {
  try {
    console.log(
      `🔄 Moving call queue entry to ProcessedCallQueue for call: ${callId}`
    );

    // Find the call queue entry by abandonedCartId and correlationId
    // The CallQueue doesn't have callId, but we can match via abandonedCartId and correlationId
    const callQueueEntry = await CallQueue.findOne({
      abandonedCartId: callRecord.abandonedCartId,
      correlationId: callRecord.correlationId,
    });
    if (!callQueueEntry) {
      console.log(
        `⚠️ Call queue entry not found for abandonedCartId: ${callRecord.abandonedCartId}, correlationId: ${callRecord.correlationId}`
      );
      return;
    }

    console.log(`📞 Found call queue entry: ${callQueueEntry._id}`);

    // Extract call data for processed queue
    const callData = webhookData.message || webhookData;

    // Create processed call queue entry
    const processedEntry = {
      abandonedCartId: callQueueEntry.abandonedCartId,
      userId: callQueueEntry.userId,
      agentId: callQueueEntry.agentId,
      shopId: callQueueEntry.shopId,
      cartId: callQueueEntry.cartId,
      status: "completed", // Always completed when moved from VAPI webhook
      nextAttemptTime: callQueueEntry.nextAttemptTime,
      callId: callId, // Use the VAPI callId from the webhook
      attemptNumber: callQueueEntry.attemptNumber,
      lastProcessedAt: new Date(),
      processingNotes: "Call completed via VAPI webhook",
      correlationId: callQueueEntry.correlationId,
      addedAt: callQueueEntry.addedAt,
    };

    // No need to store call result data here - it's already in the Call collection

    // Create the processed call queue entry
    const newProcessedEntry = new ProcessedCallQueue(processedEntry);
    await newProcessedEntry.save();

    console.log(
      `✅ Created ProcessedCallQueue entry: ${newProcessedEntry._id}`
    );

    // Remove the original call queue entry
    await CallQueue.findByIdAndDelete(callQueueEntry._id);

    console.log(`🗑️ Removed original CallQueue entry: ${callQueueEntry._id}`);

    logDbOperation(
      "CREATE",
      "ProcessedCallQueue",
      newProcessedEntry._id,
      null,
      {
        originalCallQueueId: callQueueEntry._id,
        callId: callId,
        eventType: eventType,
        status: "completed",
      }
    );

    logDbOperation("DELETE", "CallQueue", callQueueEntry._id, null, {
      movedToProcessedQueue: newProcessedEntry._id,
      callId: callId,
    });
  } catch (error) {
    console.error(
      `❌ Error moving call queue entry to ProcessedCallQueue for call ${callId}:`,
      error.message
    );
    logApiError("VAPI_WEBHOOK", "move_to_processed_queue", 500, error, null, {
      callId,
      eventType,
      errorMessage: error.message,
    });
  }
}

/**
 * Create a new CallQueue entry for retry attempts
 */
async function createRetryCallQueueEntry(
  abandonedCart,
  callRecord,
  nextAttemptTime,
  attemptNumber
) {
  try {
    console.log(
      `🔄 Creating retry CallQueue entry for abandonedCart: ${abandonedCart._id}, attempt: ${attemptNumber}`
    );

    // Find the original CallQueue entry to replicate
    const originalCallQueueEntry = await CallQueue.findOne({
      abandonedCartId: callRecord.abandonedCartId,
      correlationId: callRecord.correlationId,
    });

    if (!originalCallQueueEntry) {
      throw new Error(
        `Original CallQueue entry not found for abandonedCartId: ${callRecord.abandonedCartId}, correlationId: ${callRecord.correlationId}`
      );
    }

    // Generate new correlation ID for the retry attempt
    const retryCorrelationId = `${
      originalCallQueueEntry.correlationId
    }_retry_${attemptNumber}_${Date.now()}`;

    // Replicate the original CallQueue entry with new retry details
    const retryCallQueueEntry = {
      abandonedCartId: originalCallQueueEntry.abandonedCartId,
      userId: originalCallQueueEntry.userId,
      agentId: originalCallQueueEntry.agentId,
      shopId: originalCallQueueEntry.shopId,
      cartId: originalCallQueueEntry.cartId,
      status: "pending",
      nextAttemptTime: nextAttemptTime,
      attemptNumber: attemptNumber,
      lastProcessedAt: null,
      processingNotes: `Retry attempt ${attemptNumber} - scheduled for ${nextAttemptTime.toISOString()}`,
      correlationId: retryCorrelationId,
      addedAt: new Date(),
    };

    // Create the new call queue entry
    const newCallQueueEntry = new CallQueue(retryCallQueueEntry);
    await newCallQueueEntry.save();

    console.log(
      `✅ Created retry CallQueue entry: ${newCallQueueEntry._id} for attempt ${attemptNumber}`
    );

    logDbOperation("CREATE", "CallQueue", newCallQueueEntry._id, null, {
      type: "retry_attempt",
      originalCallQueueId: originalCallQueueEntry._id,
      abandonedCartId: abandonedCart._id,
      attemptNumber: attemptNumber,
      nextAttemptTime: nextAttemptTime,
      correlationId: retryCorrelationId,
      reason: "Customer busy or no answer - scheduling retry",
    });

    return {
      success: true,
      callQueueEntry: newCallQueueEntry,
    };
  } catch (error) {
    console.error(
      `❌ Error creating retry CallQueue entry for abandonedCart ${abandonedCart._id}:`,
      error.message
    );
    logApiError("VAPI_WEBHOOK", "create_retry_call_queue", 500, error, null, {
      abandonedCartId: abandonedCart._id,
      attemptNumber: attemptNumber,
      nextAttemptTime: nextAttemptTime,
      errorMessage: error.message,
    });
    return {
      success: false,
      error: error.message,
    };
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

  // Find the retry interval for the NEXT attempt
  // The agent config has intervals like: attempt 1 (30min), attempt 2 (5min), attempt 3 (3hours)
  // When totalAttempts = 1 (first call failed), we want attempt 2 (5min delay)
  const nextAttemptNumber = totalAttempts + 1;
  const retryInterval = agentRetryIntervals.find(
    (interval) => interval.attempt === nextAttemptNumber
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

  console.log(
    `📅 Next call calculation: attempt ${totalAttempts} -> attempt ${nextAttemptNumber}, delay: ${retryInterval.delay} ${retryInterval.delayUnit} (${delayMs}ms)`
  );

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
 * Update billing period usage for abandoned calls
 */
async function updateBillingPeriodUsage(userId, abandonedCartId) {
  try {
    // Check if this is the first call for this abandoned cart
    const abandonedCart = await AbandonedCart.findById(abandonedCartId);
    if (abandonedCart && abandonedCart.totalAttempts === 0) {
      // First call for this unique abandoned cart (totalAttempts is 0 before incrementing)

      // Update User model usage
      await User.findByIdAndUpdate(userId, {
        $inc: { "subscription.currentPeriodUsage.abandonedCallsUsed": 1 },
        "subscription.currentPeriodUsage.lastUpdated": new Date(),
      });

      console.log(
        `📊 Updated abandoned call usage for user ${userId} - first call for unique cart ${abandonedCartId}`
      );

      logDbOperation("update", "User", userId, null, {
        action: "increment_abandoned_call_usage",
        abandonedCartId: abandonedCartId,
        totalAttempts: abandonedCart.totalAttempts,
        isFirstCall: true,
      });
    } else {
      console.log(
        `📊 Skipped usage increment for user ${userId} - not first call for cart ${abandonedCartId} (totalAttempts: ${
          abandonedCart?.totalAttempts || "N/A"
        })`
      );
    }
  } catch (error) {
    console.error(
      `❌ Error updating billing period usage for user ${userId}:`,
      error.message
    );
    logApiError(
      "VAPI_WEBHOOK",
      "update_billing_period_usage",
      500,
      error,
      userId,
      {
        abandonedCartId,
        errorMessage: error.message,
      }
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
