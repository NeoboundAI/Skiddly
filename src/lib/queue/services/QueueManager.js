import CallQueue from "../../../models/CallQueue.js";
import ProcessedCallQueue from "../../../models/ProcessedCallQueue.js";
import AbandonedCart from "../../../models/AbandonedCart.js";
import { logDbOperation } from "../../apiLogger.js";
import { formatReadableTime } from "../../../utils/timeUtils.js";

/**
 * Queue Manager Service
 * Handles all queue-related operations and status updates
 */
class QueueManager {
  /**
   * Get pending calls ready for processing
   */
  async getPendingCalls(limit = 5) {
    try {
      const pendingCalls = await CallQueue.find({
        status: "pending",
        nextAttemptTime: { $lte: new Date() },
      })
        .sort({ nextAttemptTime: 1 })
        .limit(limit);

      return {
        success: true,
        calls: pendingCalls,
        count: pendingCalls.length,
      };
    } catch (error) {
      console.error("Error fetching pending calls:", error.message);
      return {
        success: false,
        error: error.message,
        calls: [],
        count: 0,
      };
    }
  }

  /**
   * Mark call as processing
   */
  async markAsProcessing(callQueueId, notes = "Call processing") {
    try {
      const updateData = {
        status: "processing",
        lastProcessedAt: new Date(),
      };

      // Add notes if provided
      if (notes) {
        updateData.processingNotes = notes;
      }

      const updatedCall = await CallQueue.findByIdAndUpdate(
        callQueueId,
        updateData,
        { new: true }
      );

      if (!updatedCall) {
        return {
          success: false,
          error: "Call queue entry not found or already processed",
          call: null,
        };
      }

      logDbOperation("UPDATE", "CallQueue", callQueueId, null, updateData);

      return {
        success: true,
        call: updatedCall,
      };
    } catch (error) {
      console.error(
        `Error marking call ${callQueueId} as processing:`,
        error.message
      );
      return {
        success: false,
        error: error.message,
        call: null,
      };
    }
  }

  /**
   * Update call queue status
   */
  async updateCallQueueStatus(callQueueId, status, notes = null) {
    try {
      await CallQueue.findByIdAndUpdate(callQueueId, {
        status,
        processingNotes: notes,
        lastProcessedAt: new Date(),
      });

      logDbOperation("UPDATE", "CallQueue", callQueueId, null, {
        status,
        processingNotes: notes,
      });

      return { success: true };
    } catch (error) {
      console.error(
        `Failed to update call queue status for ${callQueueId}:`,
        error.message
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Mark call as completed
   */
  async markAsCompleted(callQueueId, notes = "Call initiated successfully") {
    return await this.updateCallQueueStatus(callQueueId, "completed", notes);
  }

  /**
   * Mark call as failed
   */
  async markAsFailed(callQueueId, reason) {
    return await this.updateCallQueueStatus(callQueueId, "failed", reason);
  }

  /**
   * Schedule a retry for a call
   */
  async scheduleRetry(callQueueId, delayMinutes = 5) {
    try {
      const nextAttemptTime = new Date(Date.now() + delayMinutes * 60 * 1000);

      await CallQueue.findByIdAndUpdate(callQueueId, {
        status: "pending",
        nextAttemptTime,
        processingNotes: `Retrying after ${delayMinutes} minutes`,
        lastProcessedAt: new Date(),
      });

      console.log(
        `📞 Scheduled retry for call queue entry ${callQueueId} at ${formatReadableTime(
          nextAttemptTime
        )}`
      );

      logDbOperation("UPDATE", "CallQueue", callQueueId, null, {
        status: "pending",
        nextAttemptTime,
        retryScheduled: true,
      });

      return {
        success: true,
        nextAttemptTime,
      };
    } catch (error) {
      console.error(
        `Failed to schedule retry for ${callQueueId}:`,
        error.message
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update abandoned cart with eligibility results
   */
  async updateAbandonedCartEligibility(
    abandonedCartId,
    isEligible,
    reasons = []
  ) {
    try {
      const updateData = {
        isQualified: isEligible,
        reasonOfNotQualified: reasons,
        isEligibleForQueue: isEligible,
      };

      // Only update orderStage if not eligible
      if (!isEligible) {
        updateData.orderStage = "not-qualified";
      }

      await AbandonedCart.findByIdAndUpdate(abandonedCartId, updateData);

      logDbOperation(
        "UPDATE",
        "AbandonedCart",
        abandonedCartId,
        null,
        updateData
      );

      return { success: true };
    } catch (error) {
      console.error(
        `Failed to update abandoned cart eligibility for ${abandonedCartId}:`,
        error.message
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get call queue statistics
   */
  async getQueueStats() {
    try {
      const stats = await CallQueue.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const statsObject = stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});

      return {
        success: true,
        stats: {
          pending: statsObject.pending || 0,
          processing: statsObject.processing || 0,
          completed: statsObject.completed || 0,
          failed: statsObject.failed || 0,
          total: Object.values(statsObject).reduce(
            (sum, count) => sum + count,
            0
          ),
        },
      };
    } catch (error) {
      console.error("Error fetching queue stats:", error.message);
      return {
        success: false,
        error: error.message,
        stats: null,
      };
    }
  }

  /**
   * Get call queue entry by ID with populated data
   */
  async getCallQueueEntry(callQueueId) {
    try {
      const callEntry = await CallQueue.findById(callQueueId)
        .populate("agentId")
        .populate("cartId")
        .populate("abandonedCartId");

      if (!callEntry) {
        return {
          success: false,
          error: "Call queue entry not found",
          call: null,
        };
      }

      return {
        success: true,
        call: callEntry,
      };
    } catch (error) {
      console.error(
        `Error fetching call queue entry ${callQueueId}:`,
        error.message
      );
      return {
        success: false,
        error: error.message,
        call: null,
      };
    }
  }

  /**
   * Clean up old completed/failed entries
   */
  async cleanupOldEntries(daysOld = 7) {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

      const result = await CallQueue.deleteMany({
        status: { $in: ["completed", "failed"] },
        lastProcessedAt: { $lt: cutoffDate },
      });

      console.log(
        `🧹 Cleaned up ${result.deletedCount} old call queue entries`
      );

      return {
        success: true,
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      console.error("Error cleaning up old entries:", error.message);
      return {
        success: false,
        error: error.message,
        deletedCount: 0,
      };
    }
  }

  /**
   * Reset stuck processing entries
   */
  async resetStuckProcessingEntries(timeoutMinutes = 30) {
    try {
      const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

      const result = await CallQueue.updateMany(
        {
          status: "processing",
          lastProcessedAt: { $lt: cutoffTime },
        },
        {
          status: "pending",
          processingNotes: "Reset from stuck processing state",
          lastProcessedAt: new Date(),
        }
      );

      console.log(`🔄 Reset ${result.modifiedCount} stuck processing entries`);

      return {
        success: true,
        resetCount: result.modifiedCount,
      };
    } catch (error) {
      console.error("Error resetting stuck entries:", error.message);
      return {
        success: false,
        error: error.message,
        resetCount: 0,
      };
    }
  }

  /**
   * Get processed call queue statistics (basic counts only)
   */
  async getProcessedQueueStats() {
    try {
      const stats = await ProcessedCallQueue.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const statsObject = stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});

      return {
        success: true,
        stats: {
          completed: statsObject.completed || 0,
          failed: statsObject.failed || 0,
          total: Object.values(statsObject).reduce(
            (sum, count) => sum + count,
            0
          ),
        },
      };
    } catch (error) {
      console.error("Error fetching processed queue stats:", error.message);
      return {
        success: false,
        error: error.message,
        stats: null,
      };
    }
  }

  /**
   * Get processed calls by user ID
   */
  async getProcessedCallsByUserId(userId, limit = 50) {
    try {
      const processedCalls = await ProcessedCallQueue.findByUserId(
        userId,
        limit
      );
      return {
        success: true,
        processedCalls,
      };
    } catch (error) {
      console.error(
        `Error fetching processed calls for user ${userId}:`,
        error.message
      );
      return {
        success: false,
        error: error.message,
        processedCalls: [],
      };
    }
  }

  /**
   * Get processed call by call ID
   */
  async getProcessedCallByCallId(callId) {
    try {
      const processedCall = await ProcessedCallQueue.findByCallId(callId);
      return {
        success: true,
        processedCall,
      };
    } catch (error) {
      console.error(
        `Error fetching processed call for callId ${callId}:`,
        error.message
      );
      return {
        success: false,
        error: error.message,
        processedCall: null,
      };
    }
  }

  /**
   * Get processed calls by abandoned cart ID
   */
  async getProcessedCallsByAbandonedCartId(abandonedCartId) {
    try {
      const processedCalls = await ProcessedCallQueue.findByAbandonedCartId(
        abandonedCartId
      );
      return {
        success: true,
        processedCalls,
      };
    } catch (error) {
      console.error(
        `Error fetching processed calls for abandoned cart ${abandonedCartId}:`,
        error.message
      );
      return {
        success: false,
        error: error.message,
        processedCalls: [],
      };
    }
  }
}

// Export singleton instance
const queueManager = new QueueManager();
export default queueManager;
