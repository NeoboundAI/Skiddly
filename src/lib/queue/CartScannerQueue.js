import queueService from "./QueueService.js";
import connectDB from "../mongodb.js";
import Cart from "../../models/Cart.js";
import AbandonedCart from "../../models/AbandonedCart.js";
import CallQueue from "../../models/CallQueue.js";
import Agent from "../../models/Agent.js";
import ShopifyShop from "../../models/ShopifyShop.js";
import { logBusinessEvent, logApiError, logDbOperation } from "../apiLogger.js";
import { generateCorrelationId } from "../../utils/correlationUtils.js";
import {
  formatReadableTime,
  formatCompactTime,
} from "../../utils/timeUtils.js";

/**
 * Cart Scanner Queue Manager
 * Handles all cart abandonment scanning and processing
 */
class CartScannerQueue {
  constructor() {
    this.jobId = "cart-scanner";
    this.config = {
      // How long before a cart is considered abandoned (in minutes)
      ABANDONED_CART_CHECK_DELAY: 1, // 1 minute for testing (change to 20 for production)
      // How often to run the scanner
      SCANNER_INTERVAL: "*/10 * * * * *", // Every 10 seconds
    };
  }

  /**
   * Initialize the cart scanner queue
   */
  async initialize() {
    console.log(
      `🛒 [${formatCompactTime(new Date())}] Initializing Cart Scanner Queue...`
    );

    try {
      // Ensure database connection
      await connectDB();
      console.log("✅ MongoDB connected for Cart Scanner Queue");

      // Register the cart scanner job
      await queueService.registerJob(
        this.jobId,
        this.config.SCANNER_INTERVAL,
        this.scanAbandonedCarts.bind(this),
        {
          runOnStart: true,
          startDelay: 2000, // Wait 2 seconds before first scan
          preventOverlap: true,
          metadata: {
            type: "cart-scanner",
            abandonmentTimeout: `${this.config.ABANDONED_CART_CHECK_DELAY} minutes`,
          },
        }
      );

      console.log(
        `✅ [${formatCompactTime(
          new Date()
        )}] Cart Scanner Queue initialized successfully`
      );
      return true;
    } catch (error) {
      console.error(
        "❌ Failed to initialize Cart Scanner Queue:",
        error.message
      );
      throw error;
    }
  }

  /**
   * Main cart scanning function
   */
  async scanAbandonedCarts(correlationId) {
    const scanStartTime = new Date();
    console.log(
      `🔍 [${formatReadableTime(scanStartTime)}] Cart scanner running...`
    );

    try {
      // Ensure database connection
      await connectDB();

      // Find carts that should be considered abandoned
      const timeoutAgo = new Date(
        Date.now() - this.config.ABANDONED_CART_CHECK_DELAY * 60 * 1000
      );

      console.log(
        `⏰ Looking for carts abandoned before: ${formatReadableTime(
          timeoutAgo
        )}`
      );

      // Count total carts in checkout
      const totalInCheckout = await Cart.countDocuments({
        status: "inCheckout",
      });

      // Find abandoned carts
      const abandonedCarts = await Cart.find({
        status: "inCheckout",
        lastActivityAt: { $lt: timeoutAgo },
      });

      console.log(`📊 Total carts in checkout: ${totalInCheckout}`);
      console.log(
        `🛒 Found ${abandonedCarts.length} carts ready for abandonment processing`
      );

      if (abandonedCarts.length === 0) {
        console.log(`✅ No abandoned carts to process at this time`);
        return;
      }

      let processedCount = 0;
      for (const cart of abandonedCarts) {
        try {
          await this.processAbandonedCart(cart, correlationId);
          processedCount++;
        } catch (error) {
          console.error(
            `❌ Failed to process cart ${cart._id}:`,
            error.message
          );
          logApiError(
            "CART_SCANNER_QUEUE",
            "processAbandonedCart",
            500,
            error,
            correlationId,
            {
              cartId: cart._id,
              shopifyCheckoutId: cart.shopifyCheckoutId,
            }
          );
        }
      }

      console.log(
        `✅ Cart scan completed. Successfully processed ${processedCount}/${abandonedCarts.length} carts`
      );

      logBusinessEvent("cart_scan_completed", correlationId, {
        processedCarts: processedCount,
        totalCartsInCheckout: totalInCheckout,
        abandonmentTimeout: `${this.config.ABANDONED_CART_CHECK_DELAY} minutes`,
      });
    } catch (error) {
      console.error("❌ Cart scanner failed:", error.message);
      logApiError(
        "CART_SCANNER_QUEUE",
        "scanAbandonedCarts",
        500,
        error,
        correlationId,
        {
          errorMessage: error.message,
        }
      );
      throw error;
    }
  }

  /**
   * Process a single abandoned cart
   * Handles both scenarios: new abandonment and cart updates
   */
  async processAbandonedCart(cart, parentCorrelationId) {
    const correlationId = generateCorrelationId(
      "abandoned",
      cart.shopifyCheckoutId,

      parentCorrelationId
    );
    console.log(`🛒 Processing abandoned cart: ${cart.shopifyCheckoutId}`);

    // Find active agent for this user
    const agent = await Agent.findOne({
      userId: cart.userId,
      type: "abandoned-cart",
      status: "active",
    });

    if (!agent) {
      console.log(
        `⚠️ No active abandoned cart agent found for user ${cart.userId}. Skipping processing.`
      );
      logApiError(
        "CART_SCANNER_QUEUE",
        "processAbandonedCart",
        404,
        new Error("No active abandoned cart agent found"),
        correlationId,
        {
          userId: cart.userId,
          cartId: cart._id,
        }
      );
      return;
    }

    // Get shop details for queue
    const shop = await ShopifyShop.findOne({ userId: cart.userId });
    if (!shop) {
      throw new Error(`Shop not found for user: ${cart.userId}`);
    }

    // Calculate next call time based on agent's wait time
    const waitTimeValue = parseInt(agent.callLogic.callSchedule.waitTime);
    const waitTimeUnit = agent.callLogic.callSchedule.waitTimeUnit;

    let nextCallTime = new Date();
    switch (waitTimeUnit) {
      case "minute":
        nextCallTime.setMinutes(nextCallTime.getMinutes() + waitTimeValue);
        break;
      case "minutes":
        nextCallTime.setMinutes(nextCallTime.getMinutes() + waitTimeValue);
        break;
      case "hours":
        nextCallTime.setHours(nextCallTime.getHours() + waitTimeValue);
        break;
      case "days":
        nextCallTime.setDate(nextCallTime.getDate() + waitTimeValue);
        break;
      default:
        nextCallTime.setMinutes(nextCallTime.getMinutes() + 30); // Default 30 minutes
    }

    // Check if abandoned cart already exists for this cart
    const existingAbandonedCart = await AbandonedCart.findOne({
      cartId: cart._id,
    });

    if (existingAbandonedCart) {
      // Check if we have already made call attempts
      const hasAttempts = existingAbandonedCart.totalAttempts > 0;
      console.log(
        `📊 Found existing abandoned cart with ${existingAbandonedCart.totalAttempts} attempts. Has attempts: ${hasAttempts}`
      );

      if (hasAttempts) {
        console.log(
          `⚠️ Cart ${cart.shopifyCheckoutId} already has ${existingAbandonedCart.totalAttempts} call attempts. Skipping processing to avoid interference.`
        );
        // Don't process if attempts have been made - let the existing call queue handle it
        return;
      } else {
        // Update existing abandoned cart (no attempts made yet)
        console.log(
          `🔄 Updating existing abandoned cart for: ${cart.shopifyCheckoutId} (no attempts made yet)`
        );
        await this.handleExistingAbandonedCart(
          cart,
          agent,
          shop,
          nextCallTime,
          correlationId,
          existingAbandonedCart
        );
      }
    } else {
      // Create new abandoned cart
      console.log(
        `📝 Creating new abandoned cart for: ${cart.shopifyCheckoutId}`
      );
      await this.handleNewAbandonedCart(
        cart,
        agent,
        shop,
        nextCallTime,
        correlationId
      );
    }
  }

  /**
   * Scenario A: Handle new abandoned cart creation
   */
  async handleNewAbandonedCart(cart, agent, shop, nextCallTime, correlationId) {
    console.log(
      `📝 Creating new abandoned cart for: ${cart.shopifyCheckoutId}`
    );

    // For new abandoned carts, we can clean up existing queue entries since no attempts have been made yet
    console.log(
      `🧹 Checking for existing queue entries for cart ${cart._id}...`
    );
    const deletedQueueEntries = await CallQueue.deleteMany({
      cartId: cart._id,
      status: "pending",
    });

    if (deletedQueueEntries.deletedCount > 0) {
      console.log(
        `🧹 Cleaned up ${deletedQueueEntries.deletedCount} existing pending queue entries for cart ${cart._id}`
      );
    } else {
      console.log(`✅ No existing queue entries found for cart ${cart._id}`);
    }

    // Create abandoned cart record
    const abandonedCart = new AbandonedCart({
      cartId: cart._id,
      userId: cart.userId,
      shopifyCheckoutId: cart.shopifyCheckoutId,
      abandonedAt: new Date(),
      nextCallTime: nextCallTime,
      correlationId: correlationId,
    });

    await abandonedCart.save();
    console.log(
      `✅ Created new abandoned cart: ${
        abandonedCart._id
      } (next call: ${formatCompactTime(nextCallTime)})`
    );

    // Update cart status to abandoned
    await Cart.findOneAndUpdate(
      { _id: cart._id },
      {
        status: "abandoned",
        lastActivityAt: new Date(),
      },
      { new: true }
    );
    console.log(`📝 Updated cart ${cart._id} - marked as abandoned`);

    // Add to call queue
    await this.addToCallQueue(
      abandonedCart,
      agent,
      shop,
      cart,
      nextCallTime,
      correlationId
    );

    logDbOperation("create", "AbandonedCart", correlationId, {
      abandonedCartId: abandonedCart._id,
      cartId: cart._id,
      action: "new_abandoned_cart_created",
    });

    console.log(
      `✅ Created new abandoned cart: ${
        abandonedCart._id
      } (next call: ${formatCompactTime(nextCallTime)})`
    );
  }

  /**
   * Scenario B: Handle existing abandoned cart update
   */
  async handleExistingAbandonedCart(
    cart,
    agent,
    shop,
    nextCallTime,
    correlationId,
    existingAbandonedCart
  ) {
    console.log(
      `🔄 Updating existing abandoned cart for: ${cart.shopifyCheckoutId}`
    );

    // Check if we have already made call attempts
    const hasAttempts = existingAbandonedCart.totalAttempts > 0;
    console.log(
      `📊 Existing abandoned cart has ${existingAbandonedCart.totalAttempts} attempts. Has attempts: ${hasAttempts}`
    );

    if (hasAttempts) {
      console.log(
        `⚠️ Cart ${cart._id} already has ${existingAbandonedCart.totalAttempts} call attempts. Preserving existing call queue entries.`
      );
      // Don't clean up existing queue entries if attempts have been made
      // Just update the abandoned cart record without touching the call queue
    } else {
      // Clean up any existing unprocessed jobs in call queue only if no attempts have been made
      console.log(
        `🧹 No attempts made yet. Checking for existing queue entries for cart ${cart._id}...`
      );
      const deletedQueueEntries = await CallQueue.deleteMany({
        cartId: cart._id,
        status: "pending",
      });

      if (deletedQueueEntries.deletedCount > 0) {
        console.log(
          `🧹 Cleaned up ${deletedQueueEntries.deletedCount} pending queue entries for cart ${cart._id}`
        );
      } else {
        console.log(`✅ No existing queue entries found for cart ${cart._id}`);
      }
    }

    // Update abandoned cart record
    await AbandonedCart.findOneAndUpdate(
      { _id: existingAbandonedCart._id },
      {
        abandonedAt: new Date(), // Update to latest abandonment time
        nextCallTime: nextCallTime,
        isEligibleForQueue: true, // Re-activate
        orderQueueStatus: "Pending",
        orderQueueState: "New",
        correlationId: correlationId,
      },
      { new: true }
    );

    // Update cart status to abandoned
    await Cart.findOneAndUpdate(
      { _id: cart._id },
      {
        status: "abandoned",
        lastActivityAt: new Date(),
      },
      { new: true }
    );
    console.log(`📝 Updated cart ${cart._id} - marked as abandoned`);

    // Only re-add to call queue if no attempts have been made yet
    if (!hasAttempts) {
      console.log(`📞 No attempts made yet. Adding to call queue.`);
      await this.addToCallQueue(
        existingAbandonedCart,
        agent,
        shop,
        cart,
        nextCallTime,
        correlationId
      );
    } else {
      console.log(
        `⚠️ Skipping call queue addition - cart already has ${existingAbandonedCart.totalAttempts} attempts`
      );
    }

    logDbOperation("update", "AbandonedCart", correlationId, {
      abandonedCartId: existingAbandonedCart._id,
      cartId: cart._id,
      action: "existing_abandoned_cart_updated",
    });

    console.log(
      `✅ Updated existing abandoned cart: ${
        existingAbandonedCart._id
      } (next call: ${formatCompactTime(nextCallTime)})`
    );
  }

  /**
   * Add abandoned cart to call queue
   */
  async addToCallQueue(
    abandonedCart,
    agent,
    shop,
    cart,
    nextCallTime,
    correlationId
  ) {
    const queueEntry = new CallQueue({
      abandonedCartId: abandonedCart._id,
      userId: cart.userId,
      agentId: agent._id,
      shopId: shop._id,
      cartId: cart._id,
      nextAttemptTime: nextCallTime,
      correlationId: correlationId,
    });

    await queueEntry.save();

    logDbOperation("create", "CallQueue", correlationId, {
      queueEntryId: queueEntry._id,
      abandonedCartId: abandonedCart._id,
      nextAttemptTime: nextCallTime,
      action: "added_to_call_queue",
    });

    console.log(
      `📞 Added to call queue: ${
        queueEntry._id
      } (scheduled for: ${formatReadableTime(nextCallTime)})`
    );
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    console.log("🔧 Updating Cart Scanner configuration...");

    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    logBusinessEvent("cart_scanner_config_updated", null, {
      oldConfig,
      newConfig: this.config,
    });

    // If scanner interval changed, update the job schedule
    if (
      newConfig.SCANNER_INTERVAL &&
      newConfig.SCANNER_INTERVAL !== oldConfig.SCANNER_INTERVAL
    ) {
      return queueService.updateJobSchedule(
        this.jobId,
        newConfig.SCANNER_INTERVAL
      );
    }

    console.log("✅ Cart Scanner configuration updated");
    return this.getStatus();
  }

  /**
   * Get current status
   */
  getStatus() {
    const jobStatus = queueService.getJobStatus(this.jobId);

    return {
      ...jobStatus,
      config: this.config,
      type: "cart-scanner",
    };
  }

  /**
   * Manually trigger a scan
   */
  async triggerManualScan() {
    console.log("🧪 Manual cart scan triggered...");
    const result = await queueService.triggerJob(this.jobId);
    return result;
  }

  /**
   * Stop the cart scanner
   */
  stop() {
    console.log("🛑 Stopping Cart Scanner Queue...");
    return queueService.stopJob(this.jobId);
  }

  /**
   * Get timing constants (for backward compatibility)
   */
  get TIMING_CONSTANTS() {
    return this.config;
  }
}

// Export singleton instance
const cartScannerQueue = new CartScannerQueue();

export default cartScannerQueue;
export { CartScannerQueue };
