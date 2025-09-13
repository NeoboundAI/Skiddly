import cron from "node-cron";
import { logBusinessEvent, logApiError } from "../apiLogger.js";
import { generateCorrelationId } from "../../utils/correlationUtils.js";
import { formatReadableTime } from "../../utils/timeUtils.js";

/**
 * Centralized Queue Service for managing all scheduled tasks
 * Uses node-cron for scheduling and provides a unified interface
 * for managing multiple queue types (cart scanning, notifications, cleanup, etc.)
 */
class QueueService {
  constructor() {
    this.jobs = new Map(); // Store all active cron jobs
    this.runningTasks = new Set(); // Track currently running tasks
    this.defaultTimezone = "UTC";
    this.isInitialized = false;
  }

  /**
   * Initialize the Queue Service
   */
  async initialize() {
    if (this.isInitialized) {
      console.log("⚠️ QueueService already initialized");
      return;
    }

    console.log("🚀 Initializing QueueService...");

    try {
      this.isInitialized = true;

      // Check if we're in a serverless environment (Vercel)
      if (process.env.VERCEL || process.env.NODE_ENV === "production") {
        console.log(
          "🌐 Serverless environment detected - using Vercel Cron Jobs"
        );
        logBusinessEvent("queue_service_initialized", null, {
          timezone: this.defaultTimezone,
          scheduler: "vercel-cron",
          environment: "serverless",
        });
      } else {
        console.log("🖥️ Local environment - using node-cron");
        logBusinessEvent("queue_service_initialized", null, {
          timezone: this.defaultTimezone,
          scheduler: "node-cron",
          environment: "local",
        });
      }

      console.log("✅ QueueService initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize QueueService:", error.message);
      this.isInitialized = false;

      logApiError("QUEUE_SERVICE", "initialization", 500, error, null, {
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Register a new scheduled job
   * @param {string} jobId - Unique identifier for the job
   * @param {string} schedule - Cron schedule expression
   * @param {Function} taskFunction - Function to execute
   * @param {Object} options - Additional options
   */
  async registerJob(jobId, schedule, taskFunction, options = {}) {
    if (!this.isInitialized) {
      throw new Error("QueueService not initialized. Call initialize() first.");
    }

    if (this.jobs.has(jobId)) {
      console.log(
        `⚠️ Job ${jobId} already exists. Stopping existing job first.`
      );
      this.stopJob(jobId);
    }

    const {
      timezone = this.defaultTimezone,
      runOnStart = false,
      startDelay = 0,
      preventOverlap = true,
      metadata = {},
    } = options;

    console.log(`📋 Registering job: ${jobId} with schedule: ${schedule}`);

    // Wrap the task function with error handling and overlap prevention
    const wrappedTaskFunction = async () => {
      const taskId = `${jobId}_${Date.now()}`;

      // Prevent overlapping executions if enabled
      if (preventOverlap && this.runningTasks.has(jobId)) {
        console.log(`⚠️ Job ${jobId} already running, skipping this cycle`);
        return;
      }

      this.runningTasks.add(jobId);
      const startTime = new Date();
      const correlationId = generateCorrelationId("queue", taskId);

      console.log(
        `🔄 [${formatReadableTime(startTime)}] Starting job: ${jobId}`
      );

      try {
        await taskFunction(correlationId);

        const endTime = new Date();
        const duration = endTime - startTime;

        console.log(`✅ Job ${jobId} completed in ${duration}ms`);

        logBusinessEvent("queue_job_completed", correlationId, {
          jobId,
          duration: `${duration}ms`,
          ...metadata,
        });
      } catch (error) {
        console.error(`❌ Job ${jobId} failed:`, error.message);

        logApiError("QUEUE_SERVICE", jobId, 500, error, correlationId, {
          jobId,
          schedule,
          ...metadata,
        });
      } finally {
        this.runningTasks.delete(jobId);
      }
    };

    // Check if we're in a serverless environment
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      console.log(
        `🌐 Serverless environment - job ${jobId} will be handled by Vercel Cron`
      );

      // Store job info without creating actual cron job
      this.jobs.set(jobId, {
        cronJob: null, // No actual cron job in serverless
        schedule,
        taskFunction: wrappedTaskFunction,
        options,
        createdAt: new Date(),
        isRunning: false,
        isServerless: true,
      });

      // Run initial execution if requested (only in serverless)
      if (runOnStart) {
        if (startDelay > 0) {
          console.log(
            `⏱️ Scheduling initial run of ${jobId} in ${startDelay}ms`
          );
          setTimeout(() => {
            wrappedTaskFunction();
          }, startDelay);
        } else {
          setTimeout(() => {
            wrappedTaskFunction();
          }, 100); // Small delay to avoid blocking
        }
      }

      logBusinessEvent("queue_job_registered", null, {
        jobId,
        schedule,
        timezone,
        runOnStart,
        startDelay,
        environment: "serverless",
        ...metadata,
      });

      return jobId;
    }

    // Local environment - use node-cron
    const cronJob = cron.schedule(schedule, wrappedTaskFunction, {
      scheduled: false, // Don't start automatically
      timezone,
    });

    // Store job info
    this.jobs.set(jobId, {
      cronJob,
      schedule,
      taskFunction: wrappedTaskFunction,
      options,
      createdAt: new Date(),
      isRunning: false,
      isServerless: false,
    });

    // Start the job
    cronJob.start();
    console.log(`✅ Job ${jobId} registered and started`);

    // Run initial execution if requested
    if (runOnStart) {
      if (startDelay > 0) {
        console.log(`⏱️ Scheduling initial run of ${jobId} in ${startDelay}ms`);
        setTimeout(() => {
          wrappedTaskFunction();
        }, startDelay);
      } else {
        setTimeout(() => {
          wrappedTaskFunction();
        }, 100); // Small delay to avoid blocking
      }
    }

    logBusinessEvent("queue_job_registered", null, {
      jobId,
      schedule,
      timezone,
      runOnStart,
      startDelay,
      environment: "local",
      ...metadata,
    });

    return jobId;
  }

  /**
   * Stop a specific job
   * @param {string} jobId - Job identifier
   */
  stopJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      console.log(`⚠️ Job ${jobId} not found`);
      return false;
    }

    // Only stop cron job if it exists (not in serverless mode)
    if (job.cronJob) {
      job.cronJob.stop();
    }

    this.jobs.delete(jobId);
    this.runningTasks.delete(jobId);

    console.log(`🛑 Job ${jobId} stopped and removed`);

    logBusinessEvent("queue_job_stopped", null, {
      jobId,
      schedule: job.schedule,
      environment: job.isServerless ? "serverless" : "local",
    });

    return true;
  }

  /**
   * Stop all jobs
   */
  stopAllJobs() {
    console.log("🛑 Stopping all queue jobs...");

    const jobIds = Array.from(this.jobs.keys());
    let stoppedCount = 0;

    for (const jobId of jobIds) {
      if (this.stopJob(jobId)) {
        stoppedCount++;
      }
    }

    console.log(`🛑 Stopped ${stoppedCount} jobs`);
    return stoppedCount;
  }

  /**
   * Get status of a specific job
   * @param {string} jobId - Job identifier
   */
  getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return null;
    }

    return {
      jobId,
      schedule: job.schedule,
      isScheduled: job.cronJob.getStatus() !== null,
      isRunning: this.runningTasks.has(jobId),
      createdAt: job.createdAt,
      options: job.options,
    };
  }

  /**
   * Get status of all jobs
   */
  getAllJobsStatus() {
    const jobs = [];

    for (const jobId of this.jobs.keys()) {
      jobs.push(this.getJobStatus(jobId));
    }

    return {
      totalJobs: jobs.length,
      runningJobs: this.runningTasks.size,
      isInitialized: this.isInitialized,
      jobs,
    };
  }

  /**
   * Manually trigger a job (useful for testing)
   * @param {string} jobId - Job identifier
   */
  async triggerJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    console.log(`🧪 Manually triggering job: ${jobId}`);

    const correlationId = generateCorrelationId("manual", jobId);
    await job.taskFunction(correlationId);

    return {
      success: true,
      jobId,
      triggeredAt: new Date().toISOString(),
      correlationId,
    };
  }

  /**
   * Update job schedule (stops and restarts the job)
   * @param {string} jobId - Job identifier
   * @param {string} newSchedule - New cron schedule
   */
  async updateJobSchedule(jobId, newSchedule) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    console.log(
      `🔄 Updating schedule for job ${jobId}: ${job.schedule} -> ${newSchedule}`
    );

    // Store the task function and options
    const { taskFunction, options } = job;

    // Stop the existing job
    this.stopJob(jobId);

    // Register with new schedule
    await this.registerJob(jobId, newSchedule, taskFunction, options);

    console.log(`✅ Job ${jobId} schedule updated successfully`);

    logBusinessEvent("queue_job_schedule_updated", null, {
      jobId,
      oldSchedule: job.schedule,
      newSchedule,
    });

    return this.getJobStatus(jobId);
  }

  /**
   * Shutdown the queue service gracefully
   */
  async shutdown() {
    console.log("🔄 Shutting down QueueService...");

    const stoppedCount = this.stopAllJobs();
    this.isInitialized = false;

    logBusinessEvent("queue_service_shutdown", null, {
      stoppedJobs: stoppedCount,
    });

    console.log("✅ QueueService shutdown complete");
    return stoppedCount;
  }
}

// Export singleton instance
const queueService = new QueueService();

export default queueService;
export { QueueService };
