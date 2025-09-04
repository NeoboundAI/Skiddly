import { agenda } from "../agenda.js";
import AbandonedCart from "../../models/AbandonedCart.js";
import { logBusinessEvent, logApiError, logExternalApi } from "../apiLogger.js";
import {
  scheduleRetryCall,
  scheduleTranscription,
  scheduleWhatsAppMessage,
} from "../agenda.js";
import {
  generateCallCorrelationId,
  generateWhatsAppCorrelationId,
} from "../../utils/correlationUtils.js";

// Job: Process call results and determine next actions
agenda.define("process-call-result", async (job) => {
  const { abandonedCartId, attemptNumber, vapiCallId, correlationId } =
    job.attrs.data;

  try {
    logBusinessEvent("job_started", correlationId, {
      jobType: "process-call-result",
      abandonedCartId,
      attemptNumber,
      vapiCallId,
    });

    // Find the abandoned cart
    const abandonedCart = await AbandonedCart.findById(
      abandonedCartId
    ).populate("agentId");

    if (!abandonedCart) {
      throw new Error("Abandoned cart not found");
    }

    // Find the specific call attempt
    const callAttempt = abandonedCart.callAttempts.find(
      (attempt) => attempt.attemptNumber === attemptNumber
    );

    if (!callAttempt) {
      throw new Error(`Call attempt ${attemptNumber} not found`);
    }

    const agent = abandonedCart.agentId;
    const callStatus = callAttempt.callStatus;
    const callOutcome =
      callAttempt.callOutcomePicked || callAttempt.callOutcomeNotPicked;

    logBusinessEvent("processing_call_result", correlationId, {
      callStatus,
      callOutcome,
      attemptNumber,
      callDuration: callAttempt.callDuration,
    });

    // Schedule transcription if call was picked and recorded
    if (callStatus === "picked" && callAttempt.recordingUrl) {
      await scheduleTranscription({
        abandonedCartId,
        attemptNumber,
        recordingUrl: callAttempt.recordingUrl,
        correlationId,
      });
    }

    // Process different call outcomes
    await processCallOutcome(abandonedCart, callAttempt, agent, correlationId);

    logBusinessEvent("job_completed", correlationId, {
      jobType: "process-call-result",
      abandonedCartId,
      finalAction:
        abandonedCart.finalActions[abandonedCart.finalActions.length - 1]
          ?.actionCode,
    });
  } catch (error) {
    logApiError("JOB", "process-call-result", 500, error, correlationId, {
      abandonedCartId,
      attemptNumber,
      vapiCallId,
    });
    throw error;
  }
});

// Helper function to process different call outcomes
async function processCallOutcome(
  abandonedCart,
  callAttempt,
  agent,
  correlationId
) {
  const { callStatus, callOutcomePicked, callOutcomeNotPicked, attemptNumber } =
    callAttempt;

  // Handle picked call outcomes
  if (callStatus === "picked" && callOutcomePicked) {
    switch (callOutcomePicked) {
      case "completed_purchase":
        // Mark cart as recovered
        await abandonedCart.markAsRecovered(correlationId, {
          completedDuringCall: true,
          attemptNumber,
        });

        logBusinessEvent("cart_recovered_during_call", correlationId, {
          abandonedCartId: abandonedCart._id,
          attemptNumber,
        });
        break;

      case "wants_discount":
      case "wants_free_shipping":
        // Send WhatsApp with discount/shipping details
        const whatsappCorrelationId = generateWhatsAppCorrelationId(
          abandonedCart._id
        );
        await scheduleWhatsAppMessage({
          abandonedCartId: abandonedCart._id,
          customerPhone: abandonedCart.customerPhone,
          messageContent: createDiscountMessage(
            abandonedCart,
            agent,
            callOutcomePicked
          ),
          correlationId: whatsappCorrelationId,
        });

        // Mark cart as resolved since we've sent the requested information
        abandonedCart.isActive = false;
        abandonedCart.resolvedAt = new Date();
        await abandonedCart.save();
        break;

      case "reschedule_request":
        // Ask customer for preferred time (would need VAPI to capture this)
        // For now, schedule retry in 24 hours
        const retryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const retryCorrelationId = generateCallCorrelationId(
          abandonedCart.shopifyCheckoutId,
          attemptNumber + 1
        );

        await scheduleRetryCall({
          abandonedCartId: abandonedCart._id,
          userId: abandonedCart.userId,
          agentId: abandonedCart.agentId._id,
          attemptNumber: attemptNumber + 1,
          reason: "customer_reschedule_request",
          correlationId: retryCorrelationId,
          retryAt: retryTime,
        });
        break;

      case "do_not_call_request":
        await abandonedCart.markAsDoNotCall(correlationId, "customer_request");
        break;

      case "customer_busy":
        // Schedule retry based on agent configuration
        if (shouldRetryCall(attemptNumber, agent.callLogic.callSchedule)) {
          const retryTime = calculateRetryTime(agent.callLogic.callSchedule);
          const retryCorrelationId = generateCallCorrelationId(
            abandonedCart.shopifyCheckoutId,
            attemptNumber + 1
          );

          await scheduleRetryCall({
            abandonedCartId: abandonedCart._id,
            userId: abandonedCart.userId,
            agentId: abandonedCart.agentId._id,
            attemptNumber: attemptNumber + 1,
            reason: "customer_busy",
            correlationId: retryCorrelationId,
            retryAt: retryTime,
          });
        } else {
          // Max retries reached
          abandonedCart.isActive = false;
          abandonedCart.resolvedAt = new Date();
          await abandonedCart.save();
        }
        break;

      case "will_think_about_it":
        // Send follow-up WhatsApp message and schedule one more retry
        const followUpCorrelationId = generateWhatsAppCorrelationId(
          abandonedCart._id
        );
        await scheduleWhatsAppMessage({
          abandonedCartId: abandonedCart._id,
          customerPhone: abandonedCart.customerPhone,
          messageContent: createThinkingMessage(abandonedCart, agent),
          correlationId: followUpCorrelationId,
        });

        // Schedule one final retry in 48 hours
        const finalRetryTime = new Date(Date.now() + 48 * 60 * 60 * 1000);
        const finalRetryCorrelationId = generateCallCorrelationId(
          abandonedCart.shopifyCheckoutId,
          attemptNumber + 1
        );

        await scheduleRetryCall({
          abandonedCartId: abandonedCart._id,
          userId: abandonedCart.userId,
          agentId: abandonedCart.agentId._id,
          attemptNumber: attemptNumber + 1,
          reason: "follow_up_after_thinking",
          correlationId: finalRetryCorrelationId,
          retryAt: finalRetryTime,
        });
        break;

      case "not_interested":
      case "abusive_language":
      case "wrong_person":
        // Mark as resolved - no further action
        abandonedCart.isActive = false;
        abandonedCart.resolvedAt = new Date();
        await abandonedCart.save();
        break;

      case "technical_issues":
        // Send WhatsApp with checkout link
        const techHelpCorrelationId = generateWhatsAppCorrelationId(
          abandonedCart._id
        );
        await scheduleWhatsAppMessage({
          abandonedCartId: abandonedCart._id,
          customerPhone: abandonedCart.customerPhone,
          messageContent: createTechnicalHelpMessage(abandonedCart, agent),
          correlationId: techHelpCorrelationId,
        });

        // Mark as resolved
        abandonedCart.isActive = false;
        abandonedCart.resolvedAt = new Date();
        await abandonedCart.save();
        break;
    }
  }

  // Handle not picked call outcomes
  if (callStatus === "not_picked" && callOutcomeNotPicked) {
    switch (callOutcomeNotPicked) {
      case "no_answer":
      case "customer_busy_line":
      case "call_disconnected":
        // Standard retry logic
        if (shouldRetryCall(attemptNumber, agent.callLogic.callSchedule)) {
          const retryTime = calculateRetryTime(agent.callLogic.callSchedule);
          const retryCorrelationId = generateCallCorrelationId(
            abandonedCart.shopifyCheckoutId,
            attemptNumber + 1
          );

          await scheduleRetryCall({
            abandonedCartId: abandonedCart._id,
            userId: abandonedCart.userId,
            agentId: abandonedCart.agentId._id,
            attemptNumber: attemptNumber + 1,
            reason: callOutcomeNotPicked,
            correlationId: retryCorrelationId,
            retryAt: retryTime,
          });
        }
        break;

      case "voicemail":
        // Leave voicemail (handled by VAPI) and schedule one retry
        if (attemptNumber < 2) {
          // Only one retry after voicemail
          const retryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
          const retryCorrelationId = generateCallCorrelationId(
            abandonedCart.shopifyCheckoutId,
            attemptNumber + 1
          );

          await scheduleRetryCall({
            abandonedCartId: abandonedCart._id,
            userId: abandonedCart.userId,
            agentId: abandonedCart.agentId._id,
            attemptNumber: attemptNumber + 1,
            reason: "voicemail_follow_up",
            correlationId: retryCorrelationId,
            retryAt: retryTime,
          });
        }
        break;

      case "wrong_number":
      case "number_not_reachable":
      case "call_rejected":
        // Mark as resolved - cannot reach customer
        abandonedCart.isActive = false;
        abandonedCart.resolvedAt = new Date();
        await abandonedCart.save();
        break;
    }
  }
}

// Helper function to create discount WhatsApp message
function createDiscountMessage(abandonedCart, agent, outcome) {
  const discountCode = agent.offerEngine.primaryDiscountCode;
  const discountValue = agent.offerEngine.primaryDiscountValue;
  const storeName = agent.storeProfile.storeName;

  if (outcome === "wants_free_shipping") {
    return `Hi ${abandonedCart.customerFirstName}! 🚚 As promised, here's your free shipping offer for your ${storeName} cart. Use this link to complete your order: ${abandonedCart.abandonedCheckoutUrl}. Free shipping automatically applied! Questions? Reply here.`;
  } else {
    return `Hi ${abandonedCart.customerFirstName}! 💰 As promised, here's your exclusive ${discountValue} discount code: ${discountCode}. Complete your order here: ${abandonedCart.abandonedCheckoutUrl}. Code expires in 24 hours! Questions? Reply here.`;
  }
}

// Helper function to create "thinking about it" message
function createThinkingMessage(abandonedCart, agent) {
  const storeName = agent.storeProfile.storeName;
  return `Hi ${abandonedCart.customerFirstName}! Take your time deciding. Your ${storeName} cart is saved here: ${abandonedCart.abandonedCheckoutUrl}. If you have any questions, just reply to this message. We're here to help! 😊`;
}

// Helper function to create technical help message
function createTechnicalHelpMessage(abandonedCart, agent) {
  const storeName = agent.storeProfile.storeName;
  const supportEmail = agent.storeProfile.supportEmail;
  return `Hi ${abandonedCart.customerFirstName}! Sorry about the technical issues. Here's a direct link to complete your ${storeName} order: ${abandonedCart.abandonedCheckoutUrl}. If you still have trouble, email us at ${supportEmail} and we'll help immediately!`;
}

// Helper function to determine if we should retry the call
function shouldRetryCall(currentAttempt, callSchedule) {
  const maxRetries = parseInt(callSchedule.maxRetries) || 3;
  return currentAttempt < maxRetries;
}

// Helper function to calculate retry time based on agent configuration
function calculateRetryTime(callSchedule) {
  const retryInterval = parseInt(callSchedule.retryInterval) || 24;
  const retryUnit = callSchedule.retryIntervalUnit || "hours";

  let delayMs;
  switch (retryUnit) {
    case "minutes":
      delayMs = retryInterval * 60 * 1000;
      break;
    case "hours":
      delayMs = retryInterval * 60 * 60 * 1000;
      break;
    case "days":
      delayMs = retryInterval * 24 * 60 * 60 * 1000;
      break;
    default:
      delayMs = 24 * 60 * 60 * 1000; // Default to 24 hours
  }

  return new Date(Date.now() + delayMs);
}
