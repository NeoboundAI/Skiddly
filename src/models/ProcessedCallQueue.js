import mongoose from "mongoose";

const processedCallQueueSchema = new mongoose.Schema(
  {
    abandonedCartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AbandonedCart",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShopifyShop",
      required: true,
    },
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
    },
    status: {
      type: String,
      enum: ["completed", "failed"],
      required: true,
    },
    nextAttemptTime: {
      type: Date,
      required: true,
    },
    callId: {
      type: String,
      required: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    lastProcessedAt: {
      type: Date,
      required: true,
    },
    processingNotes: {
      type: String,
      required: true,
    },
    correlationId: {
      type: String,
      required: true,
    },
    addedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
processedCallQueueSchema.index({ userId: 1, status: 1 });
processedCallQueueSchema.index({ agentId: 1, status: 1 });
processedCallQueueSchema.index({ shopId: 1, status: 1 });
processedCallQueueSchema.index({ correlationId: 1 });
processedCallQueueSchema.index({ callId: 1 });
processedCallQueueSchema.index({ addedAt: -1 });

// Static methods
processedCallQueueSchema.statics.findByCallId = function (callId) {
  return this.findOne({ callId });
};

processedCallQueueSchema.statics.findByAbandonedCartId = function (
  abandonedCartId
) {
  return this.find({ abandonedCartId }).sort({ addedAt: -1 });
};

processedCallQueueSchema.statics.findByUserId = function (userId, limit = 50) {
  return this.find({ userId })
    .sort({ addedAt: -1 })
    .limit(limit)
    .populate("abandonedCartId", "shopifyCheckoutId totalAttempts")
    .populate("agentId", "name type");
};

const ProcessedCallQueue =
  mongoose.models.ProcessedCallQueue ||
  mongoose.model("ProcessedCallQueue", processedCallQueueSchema);

export default ProcessedCallQueue;
