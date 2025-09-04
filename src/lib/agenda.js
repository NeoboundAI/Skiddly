import Agenda from "agenda";
import connectDB from "./mongodb.js";
import { logBusinessEvent, logApiError } from "./apiLogger.js";

// Initialize Agenda with MongoDB connection
const agenda = new Agenda({
  db: {
    address: process.env.MONGODB_URI,
    collection: "agendaJobs",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  processEvery: "10 seconds", // Check for jobs every 10 seconds
  maxConcurrency: 20, // Max concurrent jobs
  defaultConcurrency: 5, // Default concurrency per job type
});

// Job type definitions
const JOB_TYPES = {
  CHECK_ABANDONED_CART: "check-abandoned-cart",
  MAKE_CALL: "make-call",
  RETRY_CALL: "retry-call",
  PROCESS_CALL_RESULT: "process-call-result",
  SEND_WHATSAPP: "send-whatsapp",
  TRANSCRIBE_CALL: "transcribe-call",
};

// Import job handlers
import "./jobs/abandonedCartChecker.js";
import "./jobs/callMaker.js";
import "./jobs/callRetryHandler.js";
import "./jobs/callResultProcessor.js";
import "./jobs/whatsappSender.js";
import "./jobs/transcriptionProcessor.js";

// Utility functions for scheduling jobs
export const scheduleJob = async (
  jobType,
  data,
  when = "now",
  options = {}
) => {
  try {
    await connectDB();

    const job = agenda.create(jobType, data);

    // Set job options
    if (options.priority) job.priority(options.priority);
    if (options.attempts) job.attempts(options.attempts);
    if (options.backoff) job.backoff(options.backoff);
    if (options.unique) job.unique(options.unique);

    // Schedule the job
    if (when === "now") {
      await job.schedule("now");
    } else if (when instanceof Date) {
      await job.schedule(when);
    } else {
      await job.schedule(when);
    }

    await job.save();

    logBusinessEvent("agenda_job_scheduled", null, {
      jobType,
      jobId: job.attrs._id,
      scheduledFor: when,
      data: {
        cartId: data.cartId,
        correlationId: data.correlationId,
      },
    });

    return job;
  } catch (error) {
    logApiError("AGENDA", "scheduleJob", 500, error, null, {
      jobType,
      data,
      when,
    });
    throw error;
  }
};

// Schedule abandoned cart check (20 minutes after cart creation/update)
export const scheduleAbandonedCartCheck = async (cartData) => {
  const checkTime = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes from now

  return scheduleJob(
    JOB_TYPES.CHECK_ABANDONED_CART,
    {
      cartId: cartData.cartId,
      shopifyCheckoutId: cartData.shopifyCheckoutId,
      userId: cartData.userId,
      correlationId: cartData.correlationId,
    },
    checkTime,
    {
      unique: { "data.cartId": cartData.cartId }, // Prevent duplicate jobs for same cart
      attempts: 3,
      backoff: "exponential",
    }
  );
};

// Schedule immediate call (after checking agent configuration)
export const scheduleCall = async (abandonedCartData, callTime = "now") => {
  return scheduleJob(
    JOB_TYPES.MAKE_CALL,
    {
      abandonedCartId: abandonedCartData.abandonedCartId,
      userId: abandonedCartData.userId,
      agentId: abandonedCartData.agentId,
      attemptNumber: abandonedCartData.attemptNumber,
      correlationId: abandonedCartData.correlationId,
    },
    callTime,
    {
      priority: "high",
      attempts: 2,
      backoff: "fixed",
    }
  );
};

// Schedule retry call based on agent configuration
export const scheduleRetryCall = async (retryData) => {
  return scheduleJob(
    JOB_TYPES.RETRY_CALL,
    {
      abandonedCartId: retryData.abandonedCartId,
      userId: retryData.userId,
      agentId: retryData.agentId,
      attemptNumber: retryData.attemptNumber,
      reason: retryData.reason,
      correlationId: retryData.correlationId,
    },
    retryData.retryAt,
    {
      unique: {
        "data.abandonedCartId": retryData.abandonedCartId,
        "data.attemptNumber": retryData.attemptNumber,
      },
      attempts: 3,
    }
  );
};

// Schedule call result processing (transcription, summary, etc.)
export const scheduleCallResultProcessing = async (callData) => {
  return scheduleJob(
    JOB_TYPES.PROCESS_CALL_RESULT,
    {
      abandonedCartId: callData.abandonedCartId,
      attemptNumber: callData.attemptNumber,
      vapiCallId: callData.vapiCallId,
      correlationId: callData.correlationId,
    },
    "now",
    {
      priority: "normal",
      attempts: 3,
      backoff: "exponential",
    }
  );
};

// Schedule WhatsApp message sending
export const scheduleWhatsAppMessage = async (whatsappData) => {
  return scheduleJob(
    JOB_TYPES.SEND_WHATSAPP,
    {
      abandonedCartId: whatsappData.abandonedCartId,
      customerPhone: whatsappData.customerPhone,
      messageContent: whatsappData.messageContent,
      correlationId: whatsappData.correlationId,
    },
    "now",
    {
      priority: "normal",
      attempts: 5,
      backoff: "exponential",
    }
  );
};

// Schedule call transcription
export const scheduleTranscription = async (transcriptionData) => {
  return scheduleJob(
    JOB_TYPES.TRANSCRIBE_CALL,
    {
      abandonedCartId: transcriptionData.abandonedCartId,
      attemptNumber: transcriptionData.attemptNumber,
      recordingUrl: transcriptionData.recordingUrl,
      correlationId: transcriptionData.correlationId,
    },
    "now",
    {
      priority: "low",
      attempts: 5,
      backoff: "exponential",
    }
  );
};

// Cancel jobs for a specific cart
export const cancelCartJobs = async (cartId) => {
  try {
    await agenda.cancel({
      $or: [{ "data.cartId": cartId }, { "data.abandonedCartId": cartId }],
    });

    logBusinessEvent("agenda_jobs_cancelled", null, {
      cartId,
      reason: "cart_purchased_or_expired",
    });
  } catch (error) {
    logApiError("AGENDA", "cancelCartJobs", 500, error, null, { cartId });
    throw error;
  }
};

// Get job statistics
export const getJobStats = async () => {
  try {
    const stats = {
      scheduled: await agenda.jobs({ nextRunAt: { $ne: null } }).length,
      running: await agenda.jobs({ lockedAt: { $ne: null } }).length,
      failed: await agenda.jobs({ failedAt: { $ne: null } }).length,
      completed: await agenda.jobs({ lastFinishedAt: { $ne: null } }).length,
    };

    return stats;
  } catch (error) {
    logApiError("AGENDA", "getJobStats", 500, error);
    return { error: "Failed to get job stats" };
  }
};

// Graceful shutdown
export const gracefulShutdown = async () => {
  await agenda.stop();
  logBusinessEvent("agenda_shutdown", null, {
    timestamp: new Date(),
  });
};

// Error handling
agenda.on("fail", (error, job) => {
  logApiError("AGENDA", "job_failed", 500, error, null, {
    jobType: job.attrs.name,
    jobId: job.attrs._id,
    data: job.attrs.data,
    attempts: job.attrs.attempts,
  });
});

agenda.on("success", (job) => {
  logBusinessEvent("agenda_job_completed", null, {
    jobType: job.attrs.name,
    jobId: job.attrs._id,
    duration: job.attrs.lastRunAt ? new Date() - job.attrs.lastRunAt : null,
    data: {
      cartId: job.attrs.data?.cartId,
      correlationId: job.attrs.data?.correlationId,
    },
  });
});

// Start agenda when this module is imported
(async () => {
  try {
    await agenda.start();
    logBusinessEvent("agenda_started", null, {
      processEvery: "10 seconds",
      maxConcurrency: 20,
    });
  } catch (error) {
    logApiError("AGENDA", "startup", 500, error);
  }
})();

export { agenda, JOB_TYPES };
export default agenda;
