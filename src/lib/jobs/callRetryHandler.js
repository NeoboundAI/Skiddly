import { agenda } from "../agenda.js";
import AbandonedCart from "../../models/AbandonedCart.js";
import Agent from "../../models/Agent.js";
import { logBusinessEvent, logApiError } from "../apiLogger.js";
import { scheduleCall } from "../agenda.js";

// Job: Handle call retry logic
agenda.define("retry-call", async (job) => {
  const {
    abandonedCartId,
    userId,
    agentId,
    attemptNumber,
    reason,
    correlationId,
  } = job.attrs.data;

  try {
    logBusinessEvent("job_started", correlationId, {
      jobType: "retry-call",
      abandonedCartId,
      attemptNumber,
      reason,
    });

    // Find the abandoned cart
    const abandonedCart = await AbandonedCart.findById(abandonedCartId);
    if (!abandonedCart) {
      throw new Error("Abandoned cart not found");
    }

    // Check if cart is still active
    if (!abandonedCart.isActive) {
      logBusinessEvent("retry_skipped", correlationId, {
        reason: "cart_inactive",
        abandonedCartId,
        attemptNumber,
      });
      return;
    }

    // Check if customer requested do-not-call
    if (abandonedCart.customerPreferences.doNotCall) {
      logBusinessEvent("retry_skipped", correlationId, {
        reason: "do_not_call",
        abandonedCartId,
        attemptNumber,
      });
      return;
    }

    // Find the agent
    const agent = await Agent.findById(agentId);
    if (!agent || agent.status !== "active") {
      throw new Error("Agent not found or inactive");
    }

    // Check if we've exceeded max retry attempts
    const maxRetries = parseInt(agent.callLogic.callSchedule.maxRetries) || 3;
    if (attemptNumber > maxRetries) {
      // Mark as no longer active - max retries exceeded
      abandonedCart.isActive = false;
      abandonedCart.resolvedAt = new Date();
      abandonedCart.nextScheduledCallAt = null;

      await abandonedCart.save();

      logBusinessEvent("max_retries_exceeded", correlationId, {
        abandonedCartId,
        attemptNumber,
        maxRetries,
      });
      return;
    }

    // Check business hours before scheduling retry
    const callTime = calculateRetryCallTime(agent.callLogic.callSchedule);

    // Add new call attempt record
    await abandonedCart.addCallAttempt(callTime, correlationId);

    // Schedule the retry call
    await scheduleCall(
      {
        abandonedCartId,
        userId,
        agentId,
        attemptNumber,
        correlationId,
      },
      callTime
    );

    logBusinessEvent("call_retry_scheduled", correlationId, {
      abandonedCartId,
      attemptNumber,
      callTime,
      reason,
    });

    logBusinessEvent("job_completed", correlationId, {
      jobType: "retry-call",
      abandonedCartId,
      attemptNumber,
      nextCallTime: callTime,
    });
  } catch (error) {
    logApiError("JOB", "retry-call", 500, error, correlationId, {
      abandonedCartId,
      attemptNumber,
      reason,
    });
    throw error;
  }
});

// Helper function to calculate when to schedule the retry call
function calculateRetryCallTime(callSchedule) {
  const now = new Date();

  // Calculate base retry time from agent configuration
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

  const baseRetryTime = new Date(now.getTime() + delayMs);

  // Adjust for business hours if necessary
  return adjustForBusinessHours(baseRetryTime, callSchedule);
}

// Helper function to adjust call time for business hours
function adjustForBusinessHours(targetTime, callSchedule) {
  if (!callSchedule.callTimeStart || !callSchedule.callTimeEnd) {
    return targetTime; // No business hour restrictions
  }

  const adjustedTime = new Date(targetTime);

  // Check if target time falls within business hours
  while (!isWithinBusinessHours(adjustedTime, callSchedule)) {
    // Move to next day
    adjustedTime.setDate(adjustedTime.getDate() + 1);

    // Set to business start time
    const [hours, minutes] = callSchedule.callTimeStart.split(":");
    adjustedTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Skip weekends if weekend calling is disabled
    if (!callSchedule.weekendCalling) {
      const day = adjustedTime.getDay();
      if (day === 0 || day === 6) {
        // Move to Monday if it's weekend
        const daysToAdd = day === 0 ? 1 : 2; // Sunday: +1, Saturday: +2
        adjustedTime.setDate(adjustedTime.getDate() + daysToAdd);
      }
    }
  }

  return adjustedTime;
}

// Helper function to check if time is within business hours
function isWithinBusinessHours(datetime, callSchedule) {
  if (!callSchedule.callTimeStart || !callSchedule.callTimeEnd) {
    return true; // No restrictions
  }

  const day = datetime.getDay(); // 0 = Sunday, 6 = Saturday

  // Check weekend calling preference
  if (!callSchedule.weekendCalling && (day === 0 || day === 6)) {
    return false;
  }

  // Check time range
  const timeString = datetime.toTimeString().substring(0, 5); // "HH:MM"
  return (
    timeString >= callSchedule.callTimeStart &&
    timeString <= callSchedule.callTimeEnd
  );
}
