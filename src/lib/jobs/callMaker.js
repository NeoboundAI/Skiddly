import { agenda } from "../agenda.js";
import AbandonedCart from "../../models/AbandonedCart.js";
import Agent from "../../models/Agent.js";
import { logBusinessEvent, logApiError, logExternalApi } from "../apiLogger.js";
import { scheduleRetryCall, scheduleCallResultProcessing } from "../agenda.js";
import { generateCallCorrelationId } from "../../utils/correlationUtils.js";

// VAPI SDK import (you'll need to install this)
// import { Vapi } from "@vapi-ai/server-sdk";

// Mock VAPI client for now - replace with actual implementation
const mockVapiClient = {
  async createCall(callConfig) {
    // Mock implementation - replace with actual VAPI call
    return {
      id: `mock_call_${Date.now()}`,
      status: "queued",
      customerNumber: callConfig.customerNumber,
      assistantId: callConfig.assistantId,
    };
  },
};

// Job: Make a phone call using VAPI
agenda.define("make-call", async (job) => {
  const { abandonedCartId, userId, agentId, attemptNumber, correlationId } =
    job.attrs.data;

  try {
    logBusinessEvent("job_started", correlationId, {
      jobType: "make-call",
      abandonedCartId,
      attemptNumber,
    });

    // Find the abandoned cart
    const abandonedCart = await AbandonedCart.findById(abandonedCartId);
    if (!abandonedCart) {
      throw new Error("Abandoned cart not found");
    }

    // Check if cart is still active and not marked as do-not-call
    if (
      !abandonedCart.isActive ||
      abandonedCart.customerPreferences.doNotCall
    ) {
      logBusinessEvent("call_skipped", correlationId, {
        reason: !abandonedCart.isActive ? "cart_inactive" : "do_not_call",
        abandonedCartId,
      });
      return;
    }

    // Find the agent
    const agent = await Agent.findById(agentId);
    if (!agent || agent.status !== "active") {
      throw new Error("Agent not found or inactive");
    }

    // Get customer phone number
    const customerPhone =
      abandonedCart.customerPhone || abandonedCart.shippingAddress?.phone;

    if (!customerPhone) {
      await abandonedCart.updateCallAttempt(attemptNumber, {
        callStatus: "failed",
        errorMessage: "No customer phone number available",
        completedAt: new Date(),
      });

      logApiError(
        "CALL",
        "make-call",
        400,
        new Error("No customer phone number"),
        correlationId,
        {
          abandonedCartId,
          attemptNumber,
        }
      );
      return;
    }

    // Update call attempt status to in_progress
    await abandonedCart.updateCallAttempt(attemptNumber, {
      initiatedAt: new Date(),
      callStatus: "in_progress",
    });

    // Prepare VAPI call configuration
    const callConfig = {
      customerNumber: customerPhone,
      assistantId: agent.assistantId, // From your agent configuration
      assistant: {
        ...agent.vapiConfiguration,
        // Inject dynamic variables into the system message
        model: {
          ...agent.vapiConfiguration.model,
          messages: agent.vapiConfiguration.model.messages.map((msg) => ({
            ...msg,
            content: injectDynamicVariables(msg.content, abandonedCart, agent),
          })),
        },
      },
      // Webhook configuration for call status updates
      serverUrl: `${process.env.BASE_URL}/api/vapi/webhooks`,
      serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET,
      // Metadata for correlation
      metadata: {
        abandonedCartId: abandonedCart._id.toString(),
        attemptNumber,
        correlationId,
        userId: userId.toString(),
      },
    };

    logExternalApi("VAPI", "create_call", correlationId, {
      customerPhone,
      assistantId: agent.assistantId,
      attemptNumber,
    });

    // Make the call using VAPI
    const vapiResponse = await mockVapiClient.createCall(callConfig);

    // Update call attempt with VAPI details
    await abandonedCart.updateCallAttempt(attemptNumber, {
      vapiCallId: vapiResponse.id,
      vapiResponse: vapiResponse,
    });

    logBusinessEvent("call_initiated", correlationId, {
      vapiCallId: vapiResponse.id,
      customerPhone,
      attemptNumber,
      status: vapiResponse.status,
    });

    // The actual call status updates will come via VAPI webhooks
    // We don't need to wait for the call to complete here

    logBusinessEvent("job_completed", correlationId, {
      jobType: "make-call",
      vapiCallId: vapiResponse.id,
      abandonedCartId,
      attemptNumber,
    });
  } catch (error) {
    // Update call attempt with error
    try {
      const abandonedCart = await AbandonedCart.findById(abandonedCartId);
      if (abandonedCart) {
        await abandonedCart.updateCallAttempt(attemptNumber, {
          callStatus: "failed",
          errorMessage: error.message,
          completedAt: new Date(),
        });

        // Check if we should retry based on agent configuration
        const agent = await Agent.findById(agentId);
        if (
          agent &&
          shouldRetryCall(attemptNumber, agent.callLogic.callSchedule)
        ) {
          const retryTime = calculateRetryTime(agent.callLogic.callSchedule);
          const retryCorrelationId = generateCallCorrelationId(
            abandonedCart.shopifyCheckoutId,
            attemptNumber + 1
          );

          await scheduleRetryCall({
            abandonedCartId,
            userId,
            agentId,
            attemptNumber: attemptNumber + 1,
            reason: "call_failed",
            correlationId: retryCorrelationId,
            retryAt: retryTime,
          });

          logBusinessEvent("call_retry_scheduled", correlationId, {
            reason: "call_failed",
            retryAttempt: attemptNumber + 1,
            retryTime,
          });
        }
      }
    } catch (updateError) {
      logApiError(
        "CALL",
        "update_failed_attempt",
        500,
        updateError,
        correlationId
      );
    }

    logApiError("JOB", "make-call", 500, error, correlationId, {
      abandonedCartId,
      attemptNumber,
      userId,
      agentId,
    });

    throw error;
  }
});

// Helper function to inject dynamic variables into system message
function injectDynamicVariables(messageContent, abandonedCart, agent) {
  const variables = {
    "{{CustomerFirstName}}": abandonedCart.customerFirstName || "Customer",
    "{{StoreName}}": agent.storeProfile.storeName,
    "{{ProductNames}}": abandonedCart.lineItems
      .map((item) => item.title)
      .join(", "),
    "{{Last4Digits}}": getPhoneLast4Digits(abandonedCart.customerPhone),
    "{{DiscountCode}}": agent.offerEngine.primaryDiscountCode,
    "{{AgentName}}": agent.agentPersona.agentName,
    "{{CartValue}}": `${abandonedCart.currency} ${abandonedCart.totalPrice}`,
    "{{TimeAbandoned}}": calculateTimeAbandoned(abandonedCart.abandonedAt),
  };

  let injectedContent = messageContent;
  Object.entries(variables).forEach(([placeholder, value]) => {
    injectedContent = injectedContent.replace(
      new RegExp(placeholder, "g"),
      value || ""
    );
  });

  return injectedContent;
}

// Helper function to get last 4 digits of phone number
function getPhoneLast4Digits(phone) {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, ""); // Remove non-digits
  return cleaned.slice(-4);
}

// Helper function to calculate time since abandonment
function calculateTimeAbandoned(abandonedAt) {
  const now = new Date();
  const diffMs = now - abandonedAt;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
  }
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
