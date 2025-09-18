import queueService from "./QueueService.js";
import connectDB from "../mongodb.js";
import { logBusinessEvent, logApiError } from "../apiLogger.js";
import { generateCorrelationId } from "../../utils/correlationUtils.js";
import { formatCompactTime } from "../../utils/timeUtils.js";

// Import models
import Agent from "../../models/Agent.js";
import Cart from "../../models/Cart.js";
import AbandonedCart from "../../models/AbandonedCart.js";

// Import services
import eligibilityChecker from "./services/EligibilityChecker.js";
import callService from "./services/CallService.js";
import queueManager from "./services/QueueManager.js";
import validationService from "./services/ValidationService.js";

/**
 * Call Queue Processor
 * Orchestrates call processing using specialized services
 */
class CallQueueProcessor {
  constructor() {
    this.jobId = "process-call-queue";
    this.config = {
      // How often to check for pending calls (every 30 seconds)
      PROCESSOR_INTERVAL: "*/10 * * * * *",
      // Number of concurrent calls to process in each cycle
      CONCURRENT_CALLS_LIMIT: 5,
    };
  }

  /**
   * Initialize the call queue processor
   */
  async initialize() {
    console.log(
      `📞 [${formatCompactTime(
        new Date()
      )}] Initializing Call Queue Processor...`
    );

    try {
      // Ensure database connection
      await connectDB();
      console.log("✅ MongoDB connected for Call Queue Processor");

      // Register the call processing job
      await queueService.registerJob(
        this.jobId,
        this.config.PROCESSOR_INTERVAL,
        this.processNextCall.bind(this),
        {
          runOnStart: true,
          startDelay: 5000, // Wait 5 seconds before first run
          preventOverlap: true,
          metadata: {
            description: "Process pending calls from CallQueue",
          },
        }
      );

      logBusinessEvent("call_queue_processor_initialized", null, {
        jobId: this.jobId,
        interval: this.config.PROCESSOR_INTERVAL,
        concurrentLimit: this.config.CONCURRENT_CALLS_LIMIT,
      });

      console.log("✅ Call Queue Processor initialized successfully");
    } catch (error) {
      console.error(
        "❌ Failed to initialize Call Queue Processor:",
        error.message
      );
      logApiError("CALL_QUEUE_PROCESSOR", "initialization", 500, error, null, {
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * Process multiple concurrent calls from the queue
   */
  async processNextCall(correlationId) {
    try {
      console.log(
        `📞 [${formatCompactTime(new Date())}] Processing up to ${
          this.config.CONCURRENT_CALLS_LIMIT
        } concurrent calls from queue...`
      );

      // Get pending calls
      const pendingCallsResult = await queueManager.getPendingCalls(
        this.config.CONCURRENT_CALLS_LIMIT
      );

      if (!pendingCallsResult.success) {
        console.error(
          "Failed to fetch pending calls:",
          pendingCallsResult.error
        );
        return;
      }

      const pendingCalls = pendingCallsResult.calls;

      if (pendingCalls.length === 0) {
        console.log(
          `📞 [${formatCompactTime(
            new Date()
          )}] No calls to process at this time`
        );
        return;
      }

      console.log(
        `📞 [${formatCompactTime(new Date())}] Found ${
          pendingCalls.length
        } calls to process concurrently`
      );

      // Process all calls concurrently
      const callPromises = pendingCalls.map((call) =>
        this.processSingleCall(call, correlationId)
      );

      const results = await Promise.allSettled(callPromises);

      // Log results
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      console.log(
        `📞 [${formatCompactTime(
          new Date()
        )}] Concurrent processing completed: ${successful} successful, ${failed} failed`
      );

      logBusinessEvent("concurrent_calls_processed", null, {
        totalCalls: pendingCalls.length,
        successful,
        failed,
        concurrentLimit: this.config.CONCURRENT_CALLS_LIMIT,
      });
    } catch (error) {
      console.log("error", error);
      console.error("Error in call queue processor:", error.message);

      logApiError(
        "CALL_QUEUE_PROCESSOR",
        "queue_processing",
        500,
        error,
        null,
        {
          errorMessage: error.message,
        }
      );
    }
  }

  /**
   * Process a single call from the queue
   */
  async processSingleCall(callEntry, correlationId) {
    const callId = callEntry._id;

    try {
      // Mark as processing first to prevent duplicate processing
      const processingResult = await queueManager.markAsProcessing(callId);

      if (!processingResult.success) {
        console.log(`Call ${callId} already processed by another instance`);
        return;
      }

      const updatedCall = processingResult.call;
      console.log("updatedCall", updatedCall);

      if (!updatedCall) {
        console.error(
          `Call queue entry ${callId} not found or already processed`
        );
        return;
      }

      console.log(
        `📞 [${formatCompactTime(
          new Date()
        )}] Processing call queue entry: ${callId}`
      );

      try {
        // Fetch all required data once
        const [agent, cart, abandonedCart] = await Promise.all([
          Agent.findById(updatedCall.agentId),
          Cart.findById(updatedCall.cartId),
          AbandonedCart.findById(updatedCall.abandonedCartId),
        ]);

        // Validate call queue entry data
        const validation = await validationService.validateCallQueueEntry(
          agent,
          cart,
          abandonedCart
        );

        if (!validation.isValid) {
          console.error(
            `Validation failed for call ${callId}:`,
            validation.errors
          );
          await queueManager.markAsFailed(
            callId,
            `Validation failed: ${validation.errors.join(", ")}`
          );
          return;
        }

        // Check eligibility
        console.log(
          `🔍 Starting eligibility check for call queue entry: ${callId}`
        );

        const eligibilityCheck = await eligibilityChecker.checkCallEligibility(
          agent,
          cart,
          abandonedCart
        );

        console.log(
          `🔍 Eligibility check completed for call queue entry: ${callId}`
        );
        console.log(
          `🔍 Eligibility result:`,
          JSON.stringify(eligibilityCheck, null, 2)
        );

        if (!eligibilityCheck.isEligible) {
          console.log(
            `Call not eligible for queue entry: ${callId}. Reasons: ${eligibilityCheck.reasons.join(
              ", "
            )}`
          );

          // Update abandoned cart with reasons for not qualifying
          await queueManager.updateAbandonedCartEligibility(
            abandonedCart._id,
            false,
            eligibilityCheck.reasons
          );

          await queueManager.markAsFailed(
            callId,
            `Not eligible: ${eligibilityCheck.reasons.join(", ")}`
          );

          // Log business event for ineligible call
          logBusinessEvent("call_not_eligible", updatedCall.userId, {
            callQueueId: callId,
            agentId: agent._id,
            cartId: cart._id,
            reasons: eligibilityCheck.reasons,
            correlationId: updatedCall.correlationId,
          });

          return;
        }

        console.log(`✅ Call eligible for queue entry: ${callId}`);

        // Log business event for eligible call
        logBusinessEvent("call_eligible", updatedCall.userId, {
          callQueueId: callId,
          agentId: agent._id,
          cartId: cart._id,
          correlationId: updatedCall.correlationId,
        });

        // Mark call queue entry as processing before initiating call
        await queueManager.markAsProcessing(
          callId,
          "Call initiation in progress"
        );

        // Initiate the call
        const callResult = await callService.initiateCall(
          agent,
          cart,
          updatedCall
        );

        if (callResult.success) {
          // Keep as processing - VAPI webhook will move to ProcessedCallQueue when call completes
          console.log(
            `✅ Call initiated successfully for queue entry ${callId}`
          );
        } else {
          // Handle call initiation failure
          if (callResult.isRetryable) {
            await queueManager.scheduleRetry(callId, 5);
          } else {
            await queueManager.markAsFailed(
              callId,
              `Call initiation failed: ${callResult.error}`
            );
          }
        }
      } catch (processingError) {
        console.log("processingError", processingError);
        console.error(
          `Error processing call queue entry ${callId}:`,
          processingError.message
        );
        await queueManager.markAsFailed(
          callId,
          `Processing error: ${processingError.message}`
        );

        logApiError(
          "CALL_QUEUE_PROCESSOR",
          "call_processing",
          500,
          processingError,
          updatedCall.userId,
          {
            callQueueId: callId,
          }
        );
      }
    } catch (error) {
      console.log("error", error);
      console.error(
        `Error in single call processor for ${callId}:`,
        error.message
      );

      // Try to update status if possible
      try {
        await queueManager.markAsFailed(
          callId,
          `Single call processing error: ${error.message}`
        );
      } catch (updateError) {
        console.error(
          `Failed to update status for ${callId}:`,
          updateError.message
        );
      }

      logApiError(
        "CALL_QUEUE_PROCESSOR",
        "single_call_processing",
        500,
        error,
        null,
        {
          callQueueId: callId,
          errorMessage: error.message,
        }
      );
    }
  }

  /**
   * Get processor status
   */
  getStatus() {
    return {
      jobId: this.jobId,
      interval: this.config.PROCESSOR_INTERVAL,
      concurrentLimit: this.config.CONCURRENT_CALLS_LIMIT,
      isRegistered: queueService.isJobRegistered(this.jobId),
      lastRun: queueService.getJobLastRun(this.jobId),
      nextRun: queueService.getJobNextRun(this.jobId),
    };
  }

  /**
   * Manually trigger call processing
   */
  async triggerProcessing() {
    console.log("🔄 Manually triggering call queue processing...");
    const correlationId = generateCorrelationId("manual", "call_queue_trigger");
    await this.processNextCall(correlationId);
  }

  /**
   * Check eligibility for a specific call queue entry (for debugging)
   */
  async checkEligibilityForCallQueueEntry(callQueueId) {
    try {
      await connectDB();

      const callEntryResult = await queueManager.getCallQueueEntry(callQueueId);

      if (!callEntryResult.success) {
        return { error: callEntryResult.error };
      }

      const callEntry = callEntryResult.call;

      // Fetch all required data once
      const [agent, cart, abandonedCart] = await Promise.all([
        Agent.findById(callEntry.agentId),
        Cart.findById(callEntry.cartId),
        AbandonedCart.findById(callEntry.abandonedCartId),
      ]);

      const eligibilityCheck = await eligibilityChecker.checkCallEligibility(
        agent,
        cart,
        abandonedCart
      );

      return {
        callQueueId,
        isEligible: eligibilityCheck.isEligible,
        reasons: eligibilityCheck.reasons,
        agentId: agent._id,
        cartId: cart._id,
        abandonedCartId: abandonedCart._id,
      };
    } catch (error) {
      console.error("Error checking eligibility:", error);
      return { error: error.message };
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    return await queueManager.getQueueStats();
  }

  /**
   * Clean up old queue entries
   */
  async cleanupOldEntries(daysOld = 7) {
    return await queueManager.cleanupOldEntries(daysOld);
  }

  /**
   * Reset stuck processing entries
   */
  async resetStuckProcessingEntries(timeoutMinutes = 30) {
    return await queueManager.resetStuckProcessingEntries(timeoutMinutes);
  }

  /**
   * Stop the processor
   */
  async stop() {
    console.log("🛑 Stopping Call Queue Processor...");
    return queueService.stopJob(this.jobId);
  }
}

// Create and export singleton instance
const callQueueProcessor = new CallQueueProcessor();
export default callQueueProcessor;
