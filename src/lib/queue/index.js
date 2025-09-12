/**
 * Queue Management Module
 *
 * This module provides a centralized queue service for managing all scheduled tasks
 * in the application. It uses node-cron for scheduling and provides a unified interface
 * for different types of queues.
 *
 * Features:
 * - Centralized job management
 * - Overlap prevention
 * - Error handling and logging
 * - Manual job triggering
 * - Dynamic schedule updates
 * - Graceful shutdown
 *
 * Queue Types:
 * - Cart Scanner: Handles abandoned cart detection and processing
 * - Call Queue Processor: Handles making calls from the CallQueue
 * - Future queues can be added here (notifications, cleanup, etc.)
 */

import queueService from "./QueueService.js";
import cartScannerQueue from "./CartScannerQueue.js";
import callQueueProcessor from "./CallQueueProcessor.js";

/**
 * Initialize all queue services
 */
export async function initializeAllQueues() {
  console.log("🚀 Initializing all queue services...");

  try {
    // Initialize the main queue service
    await queueService.initialize();

    // Initialize specific queue managers
    await cartScannerQueue.initialize();
    await callQueueProcessor.initialize();

    console.log("✅ All queue services initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize queue services:", error.message);
    throw error;
  }
}

/**
 * Stop all queue services
 */
export async function stopAllQueues() {
  console.log("🛑 Stopping all queue services...");

  try {
    const stoppedCount = await queueService.shutdown();
    console.log(`✅ Stopped ${stoppedCount} queue services`);
    return stoppedCount;
  } catch (error) {
    console.error("❌ Failed to stop queue services:", error.message);
    throw error;
  }
}

/**
 * Get status of all queues
 */
export function getAllQueuesStatus() {
  return {
    queueService: queueService.getAllJobsStatus(),
    cartScanner: cartScannerQueue.getStatus(),
    callQueueProcessor: callQueueProcessor.getStatus(),
  };
}

// Export individual services
export { queueService, cartScannerQueue, callQueueProcessor };

// Export default for backward compatibility
export default {
  initializeAllQueues,
  stopAllQueues,
  getAllQueuesStatus,
  queueService,
  cartScannerQueue,
  callQueueProcessor,
};
