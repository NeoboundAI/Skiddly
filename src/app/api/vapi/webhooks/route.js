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
import { formatReadableTime } from "@/utils/timeUtils";
import {
  logApiError,
  logApiSuccess,
  logBusinessEvent,
  logDbOperation,
} from "@/lib/apiLogger";
import { CALL_STATUS, ORDER_QUEUE_STATUS } from "@/constants/callConstants.js";
import callAnalysisService from "@/services/callAnalysisService";

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

    // Log webhook processing order for debugging
    console.log(`📋 Webhook processing: ${eventType} for call ${callId}`);
    console.log(`📋 Webhook data structure:`, {
      hasMessage: !!webhookData.message,
      hasCall: !!webhookData.call,
      messageType: webhookData.message?.type,
      messageStatus: webhookData.message?.status,
      callStatus: webhookData.call?.status,
      hasEndedReason: !!webhookData.message?.endedReason,
    });
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

    // Fetch related data once to avoid multiple database calls
    const [abandonedCart, agent, callQueueEntry] = await Promise.all([
      AbandonedCart.findById(callRecord.abandonedCartId),
      callRecord.agentId ? Agent.findById(callRecord.agentId) : null,
      CallQueue.findOne({
        abandonedCartId: callRecord.abandonedCartId,
        correlationId: callRecord.correlationId,
      }),
    ]);

    if (!abandonedCart) {
      console.log(`⚠️ AbandonedCart not found: ${callRecord.abandonedCartId}`);
      return;
    }

    // Process the webhook and get call analysis
    const callAnalysis = await processCallAnalysis(
      webhookData,
      callId,
      callStatus,
      eventType,
      callRecord,
      abandonedCart,
      agent
    );

    // Update the Call record with analysis results
    const updatedCall = await Call.findByIdAndUpdate(
      callRecord._id,
      callAnalysis.callUpdateData,
      { new: true }
    );

    console.log(`✅ Updated Call record: ${updatedCall._id}`);

    // Update AbandonedCart with call information only for end-of-call-report
    // (status-update events should only update the Call record, not AbandonedCart)
    if (eventType === "end-of-call-report") {
      await updateAbandonedCartWithCallInfo(
        callRecord.abandonedCartId,
        callId,
        callAnalysis,
        eventType,
        abandonedCart,
        agent,
        callRecord,
        callQueueEntry
      );

      // Update billing period usage for abandoned calls
      await updateBillingPeriodUsage(
        callRecord.userId,
        callRecord.abandonedCartId,
        abandonedCart
      );
    }

    // Move completed call queue entry to ProcessedCallQueue only for end-of-call-report
    // (not for status-update events, as end-of-call-report comes later with full details)
    if (eventType === "end-of-call-report") {
      await moveCallQueueToProcessed(
        callId,
        callRecord,
        webhookData,
        eventType,
        callQueueEntry
      );
    }

    logDbOperation("UPDATE", "Call", callRecord._id, null, {
      webhookEvent: eventType,
      callStatus: callAnalysis.callUpdateData.callStatus,
      callOutcome: callAnalysis.callUpdateData.callOutcome,
      finalAction: callAnalysis.callUpdateData.finalAction,
      endedReason: callAnalysis.callUpdateData.endedReason,
      picked: callAnalysis.callUpdateData.picked,
      nextCallTime: callAnalysis.callUpdateData.nextCallTime,
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
 * Process call analysis and determine outcomes
 */
async function processCallAnalysis(
  webhookData,
  callId,
  callStatus,
  eventType,
  callRecord,
  abandonedCart,
  agent
) {
  const callData = webhookData.message || webhookData;
  const callUpdateData = {
    updatedAt: new Date(),
  };

  // Handle different event types
  if (eventType === "status-update") {
    // Check if this status-update contains final call information (endedReason)
    if (callData.endedReason) {
      // This is actually a final call status update, treat it like end-of-call-report
      console.log(
        `📞 Status-update with final call info for call ${callId}: endedReason=${callData.endedReason}, status=${callData.status}`
      );
      return await processEndOfCallReport(
        callData,
        callRecord,
        callUpdateData,
        abandonedCart,
        agent
      );
    } else {
      // Basic status update - only update if we don't already have a final status
      // Don't override final statuses from end-of-call-report
      // Check status from both possible locations
      const statusUpdate = callData.status || callData.call?.status;

      console.log(
        `📞 Basic status update for call ${callId}: ${statusUpdate}, existing outcome: ${callRecord.callOutcome}`
      );

      if (statusUpdate && !callRecord.callOutcome) {
        callUpdateData.callStatus = statusUpdate;
        if (statusUpdate === "in-progress") {
          callUpdateData.picked = true;
          console.log(`📞 Customer picked up the call! Setting picked=true`);
        } else if (statusUpdate === "ringing") {
          callUpdateData.picked = false;
          console.log(`📞 Call is ringing, customer not yet picked up`);
        }
        console.log(`✅ Updated call status to: ${statusUpdate}`);
      } else {
        console.log(
          `⏭️ Skipped status update - call already has outcome: ${callRecord.callOutcome}`
        );
      }
    }
  } else if (eventType === "end-of-call-report") {
    // End of call - perform full analysis
    return await processEndOfCallReport(
      callData,
      callRecord,
      callUpdateData,
      abandonedCart,
      agent
    );
  } else if (eventType === "hang") {
    // Call hangup
    callUpdateData.callStatus = callStatus || "ended";
    callUpdateData.endedReason = "call-hung-up";
    callUpdateData.providerEndReason = "call-hung-up";
  } else {
    // Unknown event type
    console.log(`⚠️ Unknown VAPI event type: ${eventType} for call ${callId}`);
    if (callStatus) {
      callUpdateData.callStatus = callStatus;
    }
  }

  return { callUpdateData };
}

/**
 * Process end of call report with AI analysis
 */
async function processEndOfCallReport(
  callData,
  callRecord,
  callUpdateData,
  abandonedCart,
  agent
) {
  console.log(
    `🔚 Processing end-of-call-report for call ${callRecord.callId}, ended reason: ${callData.endedReason}`
  );

  // Store basic call data
  callUpdateData.providerEndReason = callData.endedReason;
  callUpdateData.endedReason = callData.endedReason;

  // Handle status from different possible locations
  const finalStatus = callData.status || callData.call?.status;
  if (finalStatus) {
    console.log(`📞 Final call status: ${finalStatus}`);
    callUpdateData.callStatus = finalStatus;
  }

  if (callData.cost !== undefined) callUpdateData.cost = callData.cost;
  if (callData.duration !== undefined)
    callUpdateData.duration = callData.duration;
  if (callData.transcript) callUpdateData.transcript = callData.transcript;
  if (callData.summary) callUpdateData.summary = callData.summary;
  if (callData.recordingUrl)
    callUpdateData.recordingUrl = callData.recordingUrl;

  // Determine if customer was reached
  const reasonCategory = categorizeEndedReason(callData.endedReason);
  const wasCustomerReached =
    reasonCategory === "customer_answered" ||
    reasonCategory === "assistant_ended";

  callUpdateData.picked = wasCustomerReached;

  if (wasCustomerReached && (callData.recordingUrl || callData.transcript)) {
    // Customer was reached - perform AI analysis
    console.log("🤖 Starting AI call analysis...");
    try {
      const analysisResult = await callAnalysisService.analyzeCall({
        recordingUrl: callData.recordingUrl,
        transcript: callData.transcript,
        endedReason: callData.endedReason,
        updatedAt: new Date(),
      });

      callUpdateData.callOutcome = analysisResult.callOutcome;
      callUpdateData.finalAction = analysisResult.finalAction;

      // Store AI analysis data in callAnalysis object
      callUpdateData.callAnalysis = {
        summary: analysisResult.summary,
        transcript: callData.transcript,
        callOutcome: analysisResult.callOutcome,
        structuredData: analysisResult.structuredData,
        confidence: analysisResult.confidence,
        analysisMethod: analysisResult.analysisMethod,
        timestamp: new Date(),
      };
      callUpdateData.callStatus = CALL_STATUS.PICKED;

      console.log(
        `✅ AI analysis completed - Outcome: ${analysisResult.callOutcome}, Action: ${analysisResult.finalAction}`
      );
    } catch (analysisError) {
      console.error("❌ AI analysis failed:", analysisError.message);
      // Fall back to basic analysis
      callUpdateData.callOutcome = "not_interested";
      callUpdateData.finalAction = "no_action_required";

      // Store fallback analysis data in callAnalysis object
      callUpdateData.callAnalysis = {
        summary: "AI analysis failed - using fallback analysis",
        transcript: callData.transcript,
        callOutcome: "not_interested",
        structuredData: {},
        confidence: 0.3,
        analysisMethod: "fallback_analysis",
        timestamp: new Date(),
      };
      callUpdateData.callStatus = CALL_STATUS.PICKED;
    }
  } else {
    // Customer was not reached - use basic categorization
    const reasonCategory = categorizeEndedReason(callData.endedReason);

    if (reasonCategory === "technical_error") {
      // Technical error - call was not actually made to customer
      callUpdateData.callOutcome = "technical_issues";
      callUpdateData.finalAction = "scheduled_retry";
      callUpdateData.callStatus = CALL_STATUS.NOT_PICKED;
      callUpdateData.picked = false;

      // Store technical error details in callAnalysis
      callUpdateData.callAnalysis = {
        summary: `Technical error occurred: ${callData.endedReason}. Call was not made to customer.`,
        transcript: callData.transcript,
        callOutcome: "technical_issues",
        structuredData: {
          technicalError: callData.endedReason,
          errorType: "technical_failure",
        },
        confidence: 1.0,
        analysisMethod: "technical_error",
        timestamp: new Date(),
      };
    } else {
      // Regular no-answer/busy scenarios
      const { callOutcome, finalAction } = getBasicCallOutcome(
        callData.endedReason
      );

      callUpdateData.callOutcome = callOutcome;
      callUpdateData.finalAction = finalAction;
      callUpdateData.callStatus = CALL_STATUS.NOT_PICKED;
    }
  }

  // Calculate next call time for retry scenarios
  if (callUpdateData.finalAction === "scheduled_retry") {
    const nextCallTime = await calculateRetryTime(
      callRecord,
      callData.endedReason,
      abandonedCart,
      agent
    );
    callUpdateData.nextCallTime = nextCallTime;
  } else {
    callUpdateData.nextCallTime = null;
  }

  // Ensure we always set the correct final call status based on the ended reason
  // This prevents status-update events from overriding the final status
  if (!callUpdateData.callStatus || callUpdateData.callStatus === "ended") {
    // Set status based on ended reason and whether customer was reached
    if (callUpdateData.picked) {
      callUpdateData.callStatus = CALL_STATUS.PICKED;
    } else {
      callUpdateData.callStatus = CALL_STATUS.NOT_PICKED;
    }
    console.log(
      `🔄 Set final call status: ${callUpdateData.callStatus} for reason: ${callData.endedReason}, picked: ${callUpdateData.picked}`
    );
  }

  console.log(
    `✅ End-of-call-report completed - Final status: ${callUpdateData.callStatus}, Outcome: ${callUpdateData.callOutcome}`
  );
  return { callUpdateData };
}

/**
 * Get basic call outcome based on ended reason
 */
function getBasicCallOutcome(endedReason) {
  const reasonCategory = categorizeEndedReason(endedReason);

  let callOutcome;
  switch (reasonCategory) {
    case "customer_busy":
      callOutcome = "customer_busy";
      break;
    case "customer_no_answer":
      callOutcome = "no_answer";
      break;
    case "voicemail":
      callOutcome = "voicemail";
      break;
    case "technical_error":
      callOutcome = "technical_issues";
      break;
    default:
      callOutcome = "call_disconnected";
  }

  const finalAction = determineFinalActionFromOutcome(callOutcome);
  return { callOutcome, finalAction };
}

/**
 * Determine final action based on call outcome (same logic as callAnalysisService)
 */
function determineFinalActionFromOutcome(callOutcome) {
  switch (callOutcome) {
    case "completed_purchase":
      return "order_completed";

    case "do_not_call_request":
    case "abusive_language":
      return "marked_dnc";

    case "reschedule_request":
      return "reschedule_call";

    case "wants_discount":
    case "wants_free_shipping":
      return "SMS_sent_with_discount_code";

    case "customer_busy":
    case "no_answer":
      return "scheduled_retry";

    case "not_interested":
    case "will_think_about_it":
    case "technical_issues":
    case "wrong_person":
    case "voicemail":
    case "call_disconnected":
    default:
      return "no_action_required";
  }
}

/**
 * Calculate retry time based on agent configuration
 */
async function calculateRetryTime(
  callRecord,
  endedReason,
  abandonedCart,
  agent
) {
  try {
    // Get agent retry intervals
    let agentRetryIntervals = [];
    if (agent?.callLogic?.callSchedule?.retryIntervals) {
      agentRetryIntervals = agent.callLogic.callSchedule.retryIntervals;
    }

    // Get current attempt count
    const currentAttempts = (abandonedCart.totalAttempts || 0) + 1;

    return calculateNextCallTime(
      currentAttempts,
      agentRetryIntervals,
      endedReason
    );
  } catch (error) {
    console.error("❌ Error calculating retry time:", error.message);
    return new Date(Date.now() + 30 * 60 * 1000); // Default 30 minutes
  }
}

/**
 * Update AbandonedCart with basic call information (no transcript/summary)
 */
async function updateAbandonedCartWithCallInfo(
  abandonedCartId,
  callId,
  callAnalysis,
  eventType,
  abandonedCart,
  agent,
  callRecord,
  callQueueEntry
) {
  try {
    console.log(`🛒 Updating AbandonedCart ${abandonedCartId} with call info`);

    // Get agent configuration
    const { maxRetries } = getAgentConfig(agent);

    // Update basic fields - don't increment attempts for technical errors
    const reasonCategory = categorizeEndedReason(
      callAnalysis.callUpdateData.endedReason
    );
    const isTechnicalError = reasonCategory === "technical_error";

    const newTotalAttempts = isTechnicalError
      ? abandonedCart.totalAttempts // Don't increment for technical errors
      : abandonedCart.totalAttempts + 1; // Increment for actual call attempts

    const hasReachedMaxRetries = newTotalAttempts >= maxRetries;

    const updateData = {
      totalAttempts: newTotalAttempts,
      lastAttemptTime: new Date(),
      lastCallStatus: callAnalysis.callUpdateData.callStatus,
      lastCallOutcome: callAnalysis.callUpdateData.callOutcome,
      finalAction: callAnalysis.callUpdateData.finalAction,
      providerEndReason: callAnalysis.callUpdateData.providerEndReason,
      callEndingReason: callAnalysis.callUpdateData.endedReason,
    };

    // Store AI analysis data if available
    if (callAnalysis.callUpdateData.callAnalysis) {
      updateData.callAnalysis = callAnalysis.callUpdateData.callAnalysis;
    }

    // Determine next action based on call outcome
    const shouldRetry = shouldScheduleRetry(
      callAnalysis.callUpdateData.callOutcome,
      callAnalysis.callUpdateData.finalAction,
      hasReachedMaxRetries
    );

    if (shouldRetry) {
      updateData.nextAttemptShouldBeMade = true;
      updateData.nextCallTime = callAnalysis.callUpdateData.nextCallTime;
      updateData.orderQueueStatus = ORDER_QUEUE_STATUS.PENDING;

      // Create new CallQueue entry for retry
      // For technical errors, use current attempt number (not incremented)
      // For regular calls, use newTotalAttempts (incremented)
      const retryAttemptNumber = isTechnicalError
        ? abandonedCart.totalAttempts
        : newTotalAttempts;

      await createRetryCallQueueEntry(
        abandonedCart,
        callRecord,
        callAnalysis.callUpdateData.nextCallTime,
        retryAttemptNumber,
        callQueueEntry
      );
    } else {
      updateData.nextAttemptShouldBeMade = false;
      updateData.nextCallTime = null;
      updateData.orderQueueStatus = ORDER_QUEUE_STATUS.COMPLETED;
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
      isTechnicalError: isTechnicalError,
      technicalErrorReason: isTechnicalError
        ? callAnalysis.callUpdateData.endedReason
        : null,
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
 * Get agent configuration for retry settings
 */
function getAgentConfig(agent) {
  let maxRetries = 6; // Default fallback

  if (agent?.callLogic?.callSchedule?.maxRetries) {
    maxRetries = agent.callLogic.callSchedule.maxRetries;
  }

  return { maxRetries };
}

/**
 * Determine if a retry should be scheduled
 */
function shouldScheduleRetry(callOutcome, finalAction, hasReachedMaxRetries) {
  // Don't retry if max attempts reached (only for actual customer attempts)
  if (hasReachedMaxRetries) return false;

  // Don't retry for completed or DNC cases
  if (
    callOutcome === "completed_purchase" ||
    callOutcome === "do_not_call_request" ||
    callOutcome === "abusive_language"
  ) {
    return false;
  }

  // Always retry for technical errors (they don't count as customer attempts)
  if (callOutcome === "technical_issues") return true;

  // Retry for scheduled_retry actions
  if (finalAction === "scheduled_retry") return true;

  // Default to no retry for other cases
  return false;
}

/**
 * Move completed call queue entry to ProcessedCallQueue
 */
async function moveCallQueueToProcessed(
  callId,
  callRecord,
  webhookData,
  eventType,
  callQueueEntry
) {
  try {
    console.log(
      `🔄 Moving call queue entry to ProcessedCallQueue for call: ${callId}`
    );

    // Use the passed callQueueEntry
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
  attemptNumber,
  originalCallQueueEntry
) {
  try {
    console.log(
      `🔄 Creating retry CallQueue entry for abandonedCart: ${abandonedCart._id}, attempt: ${attemptNumber}`
    );

    // Use the passed originalCallQueueEntry
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
      attemptNumber: attemptNumber + 1,
      lastProcessedAt: null,
      processingNotes: `Retry attempt ${attemptNumber} - scheduled for ${formatReadableTime(
        nextAttemptTime
      )}`,
      correlationId: retryCorrelationId,
      action: "scheduled_retry",
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
      attemptNumber: attemptNumber + 1,
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
      attemptNumber: attemptNumber + 1,
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
async function updateBillingPeriodUsage(
  userId,
  abandonedCartId,
  abandonedCart
) {
  try {
    // Check if this is the first call for this abandoned cart
    if (abandonedCart && abandonedCart.totalAttempts === 1) {
      // First call for this unique abandoned cart (totalAttempts is 1 after incrementing)

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
