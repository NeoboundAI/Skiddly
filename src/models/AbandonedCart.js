import mongoose from "mongoose";
import {
  ORDER_STAGE,
  ORDER_QUEUE_STATUS,
  CALL_STATUS,
  ALL_CALL_OUTCOMES,
  ALL_FINAL_ACTIONS,
} from "../constants/callConstants.js";

const AbandonedCartSchema = new mongoose.Schema(
  {
    // Reference to original cart (unique - one abandoned cart per cart)
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
      unique: true,
      index: true,
    },

    // User reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Agent reference (assigned during queue processing)
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      default: null,
    },

    // Shopify checkout ID (for quick lookups)
    shopifyCheckoutId: {
      type: String,
      required: true,
      index: true,
    },

    // Abandoned timestamp
    abandonedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Call Logic & Status
    isDNP: {
      type: Boolean,
      default: false, // "Do Not Pursue"
    },

    totalAttempts: {
      type: Number,
      default: 0,
    },

    nextCallTime: {
      type: Date,
      default: null,
      index: true,
    },

    lastAttemptTime: {
      type: Date,
      default: null,
    },

    // Order & Call Outcome
    orderStage: {
      type: String,
      enum: Object.values(ORDER_STAGE),
      default: ORDER_STAGE.ABANDONED,
      index: true,
    },

    lastCallStatus: {
      type: String,
      enum: Object.values(CALL_STATUS),
      default: null,
    },

    lastCallOutcome: {
      type: String,
      enum: Object.values(ALL_CALL_OUTCOMES),
      default: null,
    },
    // Raw call end reason from provider
    providerEndReason: {
      type: String,
    },

    // Processed call ending reason
    callEndingReason: {
      type: String,
    },
    finalAction: {
      type: String,
      enum: Object.values(ALL_FINAL_ACTIONS),
      default: null,
    },

    // Queue & Eligibility
    nextAttemptShouldBeMade: {
      type: Boolean,
      default: true,
    },

    orderQueueStatus: {
      type: String,
      enum: Object.values(ORDER_QUEUE_STATUS),
      default: ORDER_QUEUE_STATUS.PENDING,
      index: true,
    },

    isQualified: {
      type: Boolean,
      default: false, // Will be updated during queue processing
    },

    reasonOfNotQualified: {
      type: [String],
      default: [],
    },

    isEligibleForQueue: {
      type: Boolean,
      default: true,
    },

    completedAt: {
      type: Date,
      default: null,
      index: true,
    },

    // Correlation ID for end-to-end tracing
    correlationId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
AbandonedCartSchema.index({ shopDomain: 1, isActive: 1, abandonedAt: -1 });
AbandonedCartSchema.index({ customerEmail: 1, isActive: 1 });
AbandonedCartSchema.index({ userId: 1, isActive: 1 });
AbandonedCartSchema.index({ agentId: 1 });
AbandonedCartSchema.index({ correlationId: 1 });

const AbandonedCart =
  mongoose.models.AbandonedCart ||
  mongoose.model("AbandonedCart", AbandonedCartSchema);

export default AbandonedCart;
