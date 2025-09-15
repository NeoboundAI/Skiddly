import queueService from "./QueueService.js";
import connectDB from "../mongodb.js";
import CallQueue from "../../models/CallQueue.js";
import Agent from "../../models/Agent.js";
import Cart from "../../models/Cart.js";
import AbandonedCart from "../../models/AbandonedCart.js";
import Call from "../../models/Call.js";
import { VapiClient } from "@vapi-ai/server-sdk";
import { logBusinessEvent, logApiError, logDbOperation } from "../apiLogger.js";
import { generateCorrelationId } from "../../utils/correlationUtils.js";
import {
  formatReadableTime,
  formatCompactTime,
} from "../../utils/timeUtils.js";

/**
 * Call Queue Processor
 * Handles processing calls from the CallQueue for abandoned cart recovery
 */
class CallQueueProcessor {
  constructor() {
    this.jobId = "process-call-queue";
    this.config = {
      // How often to check for pending calls (every 30 seconds)
      PROCESSOR_INTERVAL: "*/30 * * * * *",
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

      // Find pending calls that are ready to be processed
      const pendingCalls = await CallQueue.find({
        status: "pending",
        nextAttemptTime: { $lte: new Date() },
      })
        .sort({ nextAttemptTime: 1 })
        .limit(this.config.CONCURRENT_CALLS_LIMIT);

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
      const updatedCall = await CallQueue.findByIdAndUpdate(
        callId,
        {
          status: "processing",
          lastProcessedAt: new Date(),
        },
        { new: true }
      );

      if (!updatedCall) {
        console.log(`Call ${callId} already processed by another instance`);
        return;
      }

      console.log(
        `📞 [${formatCompactTime(
          new Date()
        )}] Processing call queue entry: ${callId}`
      );

      try {
        // Fetch related data
        const [agent, cart, abandonedCart] = await Promise.all([
          Agent.findById(updatedCall.agentId),
          Cart.findById(updatedCall.cartId),
          AbandonedCart.findById(updatedCall.abandonedCartId),
        ]);

        if (!agent) {
          console.error(`Agent not found for call queue entry: ${callId}`);
          await this.updateCallQueueStatus(callId, "failed", "Agent not found");
          return;
        }

        if (!cart) {
          console.error(`Cart not found for call queue entry: ${callId}`);
          await this.updateCallQueueStatus(callId, "failed", "Cart not found");
          return;
        }

        if (!abandonedCart) {
          console.error(
            `Abandoned cart not found for call queue entry: ${callId}`
          );
          await this.updateCallQueueStatus(
            callId,
            "failed",
            "Abandoned cart not found"
          );
          return;
        }

        // Check if agent is active and live
        if (!agent.testLaunch?.isLive) {
          console.log(`Agent is not live for call queue entry: ${callId}`);
          await this.updateCallQueueStatus(callId, "failed", "Agent not live");
          return;
        }

        // Check eligibility based on agent conditions
        console.log(
          `🔍 Starting eligibility check for call queue entry: ${callId}`
        );
        console.log(
          `🔍 Agent data:`,
          JSON.stringify(
            {
              agentId: agent._id,
              conditions: agent.callLogic?.conditions || [],
              conditionsCount: agent.callLogic?.conditions?.length || 0,
            },
            null,
            2
          )
        );
        console.log(
          `🔍 Cart data:`,
          JSON.stringify(
            {
              cartId: cart._id,
              totalPrice: cart.totalPrice,
              customerId: cart.customerId,
            },
            null,
            2
          )
        );

        let eligibilityCheck;
        try {
          eligibilityCheck = await this.checkCallEligibility(
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
        } catch (eligibilityError) {
          console.error(
            `❌ Error during eligibility check for ${callId}:`,
            eligibilityError
          );
          await this.updateCallQueueStatus(
            callId,
            "failed",
            `Eligibility check error: ${eligibilityError.message}`
          );
          return;
        }
        if (!eligibilityCheck.isEligible) {
          console.log(
            `Call not eligible for queue entry: ${callId}. Reasons: ${eligibilityCheck.reasons.join(
              ", "
            )}`
          );

          // Update abandoned cart with reasons for not qualifying
          await AbandonedCart.findByIdAndUpdate(abandonedCart._id, {
            isQualified: false,
            reasonOfNotQualified: eligibilityCheck.reasons,
            isEligibleForQueue: false,
            orderStage: "not-qualified",
          });

          await this.updateCallQueueStatus(
            callId,
            "failed",
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

        const phoneNumberConfig = agent.testLaunch?.connectedPhoneNumbers?.[0];
        console.log(
          "Phone number config:",
          JSON.stringify(phoneNumberConfig, null, 2)
        );

        if (!phoneNumberConfig?.vapiNumberId) {
          console.error(
            `No VAPI phone number configured for agent: ${agent._id}`
          );
          console.error("phoneNumberConfig:", phoneNumberConfig);
          await this.updateCallQueueStatus(
            callId,
            "failed",
            "No phone number configured"
          );
          return;
        }

        // Format phone number
        let formattedPhoneNumber = cart.customerPhone;
        console.log("formattedPhoneNumber", formattedPhoneNumber);
        if (formattedPhoneNumber && /^91\d{10}$/.test(formattedPhoneNumber)) {
          formattedPhoneNumber = `+${formattedPhoneNumber}`;
        }
        console.log("formattedPhoneNumber", formattedPhoneNumber);

        if (!formattedPhoneNumber) {
          console.error(`No phone number found for cart: ${cart._id}`);
          await this.updateCallQueueStatus(callId, "failed", "No phone number");
          return;
        }

        console.log(
          `📞 Initiating call to ${formattedPhoneNumber} for customer: ${
            cart.customerFirstName || "Unknown"
          }`
        );

        // Initialize VAPI client
        const vapiClient = new VapiClient({
          token: process.env.VAPI_API_KEY,
        });

        try {
          const response = await vapiClient.calls.create({
            assistantId: agent.assistantId,
            phoneNumberId: phoneNumberConfig.vapiNumberId,
            customer: {
              number: formattedPhoneNumber.startsWith("+91")
                ? formattedPhoneNumber
                : `+91${formattedPhoneNumber}`,
            },
            assistantOverrides: {
              variableValues: {
                // Using actual cart data for variables
                CustomerFirstName: cart.customerFirstName || "",
                StoreName: agent.storeProfile?.storeName || "",
                ProductNames:
                  cart.lineItems?.map((item) => item.title).join(", ") || "",
                AgentName: agent.agentPersona?.agentName || "",
                CartValue: cart.totalPrice || "",
                Last4Digits: formattedPhoneNumber.slice(-4) || "",
                DiscountCode: "",
              },
            },
          });
          console.log("vapi response", response);
          console.log(
            `📞 Call initiated successfully. VAPI Call ID: ${response.id}`
          );

          // Create Call record
          await Call.create({
            callId: response.id,
            userId: updatedCall.userId,
            abandonedCartId: updatedCall.abandonedCartId,
            agentId: updatedCall.agentId,
            cartId: updatedCall.cartId,
            assistantId: agent.assistantId,
            customerNumber: formattedPhoneNumber,
            status: response.status || "queued",
            endedReason: "initiated",
            cost: 0,
            duration: 0,
            picked: false,
            vapiCallId: response.id,
            correlationId: updatedCall.correlationId,
            createdAt: response.createdAt,
            updatedAt: response.updatedAt,
          });

          // Mark call queue entry as completed
          await this.updateCallQueueStatus(
            callId,
            "completed",
            "Call initiated successfully"
          );

          logBusinessEvent("call_initiated", updatedCall.userId, {
            callId: response.id,
            customerNumber: formattedPhoneNumber,
            agentId: agent._id,
            cartId: cart._id,
            correlationId: updatedCall.correlationId,
          });
        } catch (vapiError) {
          console.error(
            `VAPI error for call queue entry ${callId}:`,
            vapiError.message
          );

          // Handle specific VAPI errors
          if (
            vapiError.message.includes("rate limit") ||
            vapiError.message.includes("busy")
          ) {
            // Retry after 5 minutes
            await this.scheduleRetry(callId, 5);
          } else {
            await this.updateCallQueueStatus(
              callId,
              "failed",
              `VAPI error: ${vapiError.message}`
            );
          }

          logApiError(
            "CALL_QUEUE_PROCESSOR",
            "vapi_call_creation",
            500,
            vapiError,
            updatedCall.userId,
            {
              callQueueId: callId,
              customerNumber: formattedPhoneNumber,
              agentId: agent._id,
            }
          );
        }
      } catch (processingError) {
        console.log("processingError", processingError);
        console.error(
          `Error processing call queue entry ${callId}:`,
          processingError.message
        );
        await this.updateCallQueueStatus(
          callId,
          "failed",
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
        await this.updateCallQueueStatus(
          callId,
          "failed",
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
   * Check if a call is eligible based on agent conditions
   */
  async checkCallEligibility(agent, cart, abandonedCart) {
    console.log(
      `🔍 checkCallEligibility method called with agent: ${agent._id}, cart: ${cart._id}`
    );
    const reasons = [];
    const conditions = agent.callLogic?.conditions || [];

    console.log(
      `🔍 Checking eligibility for cart ${cart._id} against ${conditions.length} conditions`
    );

    for (const condition of conditions) {
      console.log(
        `🔍 Processing condition: ${condition.type}, enabled: ${
          condition.enabled
        }, operator: ${condition.operator}, value: ${JSON.stringify(
          condition.value
        )}`
      );

      if (!condition.enabled) {
        console.log(`⏭️ Skipping disabled condition: ${condition.type}`);
        continue;
      }

      console.log(
        `🔍 Checking condition: ${condition.type} (${condition.operator} ${condition.value})`
      );

      switch (condition.type) {
        case "cart-value":
          const cartValueResult = this.checkCartValueCondition(cart, condition);
          console.log(`💰 Cart value condition result: ${cartValueResult}`);
          if (!cartValueResult) {
            reasons.push(
              `Cart value ${cart.totalPrice} does not meet condition: ${condition.operator} ${condition.value}`
            );
          }
          break;

        case "customer-type":
          if (!this.checkCustomerTypeCondition(cart, condition)) {
            reasons.push(
              `Customer type does not match condition: ${
                condition.operator
              } ${condition.value.join(", ")}`
            );
          }
          break;

        case "products":
          if (!this.checkProductsCondition(cart, condition)) {
            reasons.push(
              `Products do not match condition: ${
                condition.operator
              } ${condition.value.join(", ")}`
            );
          }
          break;

        case "previous-orders":
          if (!this.checkPreviousOrdersCondition(cart, condition)) {
            reasons.push(
              `Previous orders do not meet condition: ${condition.operator} ${condition.value}`
            );
          }
          break;

        case "location":
          if (!this.checkLocationCondition(cart, condition)) {
            reasons.push(
              `Location does not match condition: ${
                condition.operator
              } ${condition.value.join(", ")}`
            );
          }
          break;

        case "coupon-code":
          if (!this.checkCouponCodeCondition(cart, condition)) {
            reasons.push(
              `Coupon code does not match condition: ${
                condition.operator
              } ${condition.value.join(", ")}`
            );
          }
          break;

        case "payment-method":
          if (!this.checkPaymentMethodCondition(cart, condition)) {
            reasons.push(
              `Payment method does not match condition: ${
                condition.operator
              } ${condition.value.join(", ")}`
            );
          }
          break;

        default:
          console.log(`⚠️ Unknown condition type: ${condition.type}`);
          break;
      }
    }

    const isEligible = reasons.length === 0;
    console.log(
      `📊 Eligibility result: ${isEligible ? "ELIGIBLE" : "NOT ELIGIBLE"}${
        reasons.length > 0 ? ` (${reasons.length} reasons)` : ""
      }`
    );

    if (reasons.length > 0) {
      console.log(`❌ Reasons for not being eligible:`, reasons);
    }

    return {
      isEligible,
      reasons,
    };
  }

  /**
   * Check cart value condition
   */
  checkCartValueCondition(cart, condition) {
    const cartValue = parseFloat(cart.totalPrice) || 0;
    const conditionValue = parseFloat(condition.value) || 0;

    console.log(
      `💰 Cart value check: ${cartValue} ${condition.operator} ${conditionValue}`
    );

    switch (condition.operator) {
      case ">=":
        const result = cartValue >= conditionValue;
        console.log(`💰 Cart value >= result: ${result}`);
        return result;
      case ">":
        return cartValue > conditionValue;
      case "<=":
        return cartValue <= conditionValue;
      case "<":
        return cartValue < conditionValue;
      case "==":
        return cartValue === conditionValue;
      default:
        console.log(`⚠️ Unknown cart value operator: ${condition.operator}`);
        return true;
    }
  }

  /**
   * Check customer type condition
   */
  checkCustomerTypeCondition(cart, condition) {
    // For now, we'll determine customer type based on whether they have a customerId
    const customerType = cart.customerId ? "Returning" : "New";
    const allowedTypes = condition.value || [];

    switch (condition.operator) {
      case "includes":
        return allowedTypes.includes(customerType);
      case "excludes":
        return !allowedTypes.includes(customerType);
      default:
        console.log(`⚠️ Unknown customer type operator: ${condition.operator}`);
        return true;
    }
  }

  /**
   * Check products condition
   */
  checkProductsCondition(cart, condition) {
    const cartProducts = cart.lineItems?.map((item) => item.title) || [];
    const requiredProducts = condition.value || [];

    switch (condition.operator) {
      case "includes":
        return requiredProducts.some((product) =>
          cartProducts.some((cartProduct) =>
            cartProduct.toLowerCase().includes(product.toLowerCase())
          )
        );
      case "excludes":
        return !requiredProducts.some((product) =>
          cartProducts.some((cartProduct) =>
            cartProduct.toLowerCase().includes(product.toLowerCase())
          )
        );
      default:
        console.log(`⚠️ Unknown products operator: ${condition.operator}`);
        return true;
    }
  }

  /**
   * Check previous orders condition
   */
  checkPreviousOrdersCondition(cart, condition) {
    // This would require additional data about previous orders
    // For now, we'll return true as we don't have this data
    console.log(`⚠️ Previous orders condition not implemented yet`);
    return true;
  }

  /**
   * Check location condition
   */
  checkLocationCondition(cart, condition) {
    const cartLocation =
      cart.shippingAddress?.country || cart.shippingAddress?.province || "";
    const allowedLocations = condition.value || [];

    if (allowedLocations.length === 0) {
      return true; // No location restrictions
    }

    switch (condition.operator) {
      case "includes":
        return allowedLocations.some((location) =>
          cartLocation.toLowerCase().includes(location.toLowerCase())
        );
      case "excludes":
        return !allowedLocations.some((location) =>
          cartLocation.toLowerCase().includes(location.toLowerCase())
        );
      default:
        console.log(`⚠️ Unknown location operator: ${condition.operator}`);
        return true;
    }
  }

  /**
   * Check coupon code condition
   */
  checkCouponCodeCondition(cart, condition) {
    const cartCoupons = cart.discountCodes?.map((dc) => dc.code) || [];
    const requiredCoupons = condition.value || [];

    if (requiredCoupons.length === 0) {
      return true; // No coupon restrictions
    }

    switch (condition.operator) {
      case "includes":
        return requiredCoupons.some((coupon) =>
          cartCoupons.some(
            (cartCoupon) => cartCoupon.toLowerCase() === coupon.toLowerCase()
          )
        );
      case "excludes":
        return !requiredCoupons.some((coupon) =>
          cartCoupons.some(
            (cartCoupon) => cartCoupon.toLowerCase() === coupon.toLowerCase()
          )
        );
      default:
        console.log(`⚠️ Unknown coupon code operator: ${condition.operator}`);
        return true;
    }
  }

  /**
   * Check payment method condition
   */
  checkPaymentMethodCondition(cart, condition) {
    // This would require additional data about payment methods
    // For now, we'll return true as we don't have this data
    console.log(`⚠️ Payment method condition not implemented yet`);
    return true;
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
    } catch (error) {
      console.error(
        `Failed to update call queue status for ${callQueueId}:`,
        error.message
      );
    }
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
    } catch (error) {
      console.error(
        `Failed to schedule retry for ${callQueueId}:`,
        error.message
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

      const callEntry = await CallQueue.findById(callQueueId)
        .populate("agentId")
        .populate("cartId")
        .populate("abandonedCartId");

      if (!callEntry) {
        return { error: "Call queue entry not found" };
      }

      const eligibilityCheck = await this.checkCallEligibility(
        callEntry.agentId,
        callEntry.cartId,
        callEntry.abandonedCartId
      );

      return {
        callQueueId,
        isEligible: eligibilityCheck.isEligible,
        reasons: eligibilityCheck.reasons,
        agentId: callEntry.agentId._id,
        cartId: callEntry.cartId._id,
        abandonedCartId: callEntry.abandonedCartId._id,
      };
    } catch (error) {
      console.error("Error checking eligibility:", error);
      return { error: error.message };
    }
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
