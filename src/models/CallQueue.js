import mongoose from "mongoose";

const CallQueueSchema = new mongoose.Schema(
  {
    // Reference to abandoned cart
    abandonedCartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AbandonedCart",
      required: true,
      index: true,
    },

    // User reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Agent reference
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      index: true,
    },

    // Shop reference
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShopifyShop",
      required: true,
      index: true,
    },

    // Cart reference (for quick access)
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
      index: true,
    },

    // Queue status
    status: {
      type: String,

      default: "pending",
      index: true,
    },

    // When this call should be attempted
    nextAttemptTime: {
      type: Date,
      required: true,
      index: true,
    },

    // When this was added to queue
    addedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Attempt tracking
    attemptNumber: {
      type: Number,
      default: 1,
    },

    // Last processing attempt
    lastProcessedAt: {
      type: Date,
      default: null,
    },

    // Processing notes/errors
    processingNotes: {
      type: String,
      default: null,
    },

    // Correlation ID for tracing
    correlationId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queue processing
CallQueueSchema.index({ status: 1, nextAttemptTime: 1 });
CallQueueSchema.index({ userId: 1, status: 1 });
CallQueueSchema.index({ agentId: 1, status: 1 });
CallQueueSchema.index({ abandonedCartId: 1, status: 1 });
CallQueueSchema.index({ correlationId: 1 });

const CallQueue =
  mongoose.models.CallQueue || mongoose.model("CallQueue", CallQueueSchema);

export default CallQueue;
