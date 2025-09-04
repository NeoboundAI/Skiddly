import mongoose from "mongoose";

const AbandonedCartSchema = new mongoose.Schema(
  {
    // Reference to original cart
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
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

    // Shopify checkout ID (for quick lookups)
    shopifyCheckoutId: {
      type: String,
      required: true,
      index: true,
    },

    // Shop domain
    shopDomain: {
      type: String,
      required: true,
      index: true,
    },

    // Customer information (duplicated for performance)
    customerEmail: {
      type: String,
      index: true,
    },

    customerPhone: {
      type: String,
      default: null,
    },

    customerFirstName: {
      type: String,
      default: null,
    },

    customerLastName: {
      type: String,
      default: null,
    },

    customerId: {
      type: String, // Shopify customer ID
      default: null,
    },

    // Cart details (duplicated for performance)
    totalPrice: {
      type: String,
      required: true,
    },

    currency: {
      type: String,
      default: "USD",
    },

    // Abandoned checkout URL from Shopify
    abandonedCheckoutUrl: {
      type: String,
      required: true,
    },

    // Line items (products in cart)
    lineItems: [
      {
        key: String,
        title: String,
        presentmentTitle: String,
        variantTitle: String,
        quantity: Number,
        price: String,
        linePrice: String,
        variantId: String,
        productId: String,
        sku: String,
        vendor: String,
      },
    ],

    // ORDER_STAGES from your table structure
    orderStage: {
      type: String,
      enum: ["abandoned", "recovered", "converted"],
      default: "abandoned",
      index: true,
    },

    // Call attempt tracking
    callAttempts: [
      {
        attemptNumber: {
          type: Number,
          required: true,
        },
        scheduledAt: {
          type: Date,
          required: true,
        },
        initiatedAt: {
          type: Date,
          default: null,
        },
        completedAt: {
          type: Date,
          default: null,
        },

        // CALL_STATUS from your table
        callStatus: {
          type: String,
          enum: ["picked", "not_picked", "scheduled", "in_progress", "failed"],
          default: "scheduled",
        },

        // CALL_OUTCOMES_PICKED (when callStatus = 'picked')
        callOutcomePicked: {
          type: String,
          enum: [
            "customer_busy",
            "not_interested",
            "wants_discount",
            "wants_free_shipping",
            "reschedule_request",
            "abusive_language",
            "do_not_call_request",
            "completed_purchase",
            "will_think_about_it",
            "technical_issues",
            "wrong_person",
          ],
          default: null,
        },

        // CALL_OUTCOMES_NOT_PICKED (when callStatus = 'not_picked')
        callOutcomeNotPicked: {
          type: String,
          enum: [
            "customer_busy_line",
            "call_disconnected",
            "voicemail",
            "no_answer",
            "network_error",
            "wrong_number",
            "number_not_reachable",
            "switched_off",
            "call_rejected",
          ],
          default: null,
        },

        // VAPI call details
        vapiCallId: {
          type: String,
          default: null,
        },

        vapiResponse: {
          type: Object,
          default: null,
        },

        // Call duration and recording
        callDuration: {
          type: Number, // in seconds
          default: null,
        },

        recordingUrl: {
          type: String,
          default: null,
        },

        transcription: {
          type: String,
          default: null,
        },

        summary: {
          type: String,
          default: null,
        },

        // Error tracking
        errorMessage: {
          type: String,
          default: null,
        },

        correlationId: {
          type: String,
          index: true,
        },
      },
    ],

    // Current call status summary
    totalCallAttempts: {
      type: Number,
      default: 0,
    },

    lastCallAttemptAt: {
      type: Date,
      default: null,
    },

    nextScheduledCallAt: {
      type: Date,
      default: null,
      index: true,
    },

    // FINAL_ACTIONS from your table
    finalActions: [
      {
        actionCode: {
          type: String,
          enum: [
            "SMS_sent_with_discount_code",
            "reschedule_call",
            "left_voicemail",
            "marked_dnc",
            "order_completed",
            "scheduled_retry",
            "whatsapp_sent",
            "no_action_required",
          ],
          required: true,
        },
        actionTakenAt: {
          type: Date,
          default: Date.now,
        },
        actionDetails: {
          type: Object,
          default: {},
        },
        correlationId: {
          type: String,
          index: true,
        },
      },
    ],

    // Customer preferences and flags
    customerPreferences: {
      doNotCall: {
        type: Boolean,
        default: false,
      },
      preferredContactTime: {
        start: String, // "09:00"
        end: String, // "18:00"
        timezone: String,
      },
      communicationChannel: {
        type: String,
        enum: ["phone", "sms", "whatsapp", "email"],
        default: "phone",
      },
    },

    // Agent qualification checks
    qualificationChecks: {
      cartValueQualified: {
        type: Boolean,
        default: false,
      },
      customerTypeQualified: {
        type: Boolean,
        default: false,
      },
      businessHoursQualified: {
        type: Boolean,
        default: false,
      },
      phoneNumberAvailable: {
        type: Boolean,
        default: false,
      },
      overallQualified: {
        type: Boolean,
        default: false,
      },
      qualificationCheckedAt: {
        type: Date,
        default: null,
      },
      qualificationDetails: {
        type: Object,
        default: {},
      },
    },

    // WhatsApp integration
    whatsappDetails: {
      sent: {
        type: Boolean,
        default: false,
      },
      sentAt: {
        type: Date,
        default: null,
      },
      messageId: {
        type: String,
        default: null,
      },
      deliveryStatus: {
        type: String,
        enum: ["sent", "delivered", "read", "failed"],
        default: null,
      },
      content: {
        type: String,
        default: null,
      },
    },

    // Important timestamps
    abandonedAt: {
      type: Date,
      required: true,
      index: true,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    // Status and activity
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Correlation ID for end-to-end tracing
    correlationId: {
      type: String,
      required: true,
      index: true,
    },

    // Additional metadata
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
AbandonedCartSchema.index({ shopDomain: 1, isActive: 1, abandonedAt: -1 });
AbandonedCartSchema.index({ customerEmail: 1, isActive: 1 });
AbandonedCartSchema.index({ userId: 1, orderStage: 1, isActive: 1 });
AbandonedCartSchema.index({ agentId: 1, nextScheduledCallAt: 1 });
AbandonedCartSchema.index({ correlationId: 1 });
AbandonedCartSchema.index({ "callAttempts.correlationId": 1 });
AbandonedCartSchema.index({ nextScheduledCallAt: 1, isActive: 1 });

// Virtual for customer full name
AbandonedCartSchema.virtual("customerFullName").get(function () {
  if (this.customerFirstName && this.customerLastName) {
    return `${this.customerFirstName} ${this.customerLastName}`;
  } else if (this.customerFirstName) {
    return this.customerFirstName;
  } else if (this.customerLastName) {
    return this.customerLastName;
  }
  return "Guest Customer";
});

// Method to add a new call attempt
AbandonedCartSchema.methods.addCallAttempt = function (
  scheduledAt,
  correlationId
) {
  const attemptNumber = this.callAttempts.length + 1;

  this.callAttempts.push({
    attemptNumber,
    scheduledAt,
    correlationId,
    callStatus: "scheduled",
  });

  this.totalCallAttempts = attemptNumber;
  this.nextScheduledCallAt = scheduledAt;
  this.lastUpdated = new Date();

  return this.save();
};

// Method to update call attempt status
AbandonedCartSchema.methods.updateCallAttempt = function (
  attemptNumber,
  updateData
) {
  const attempt = this.callAttempts.find(
    (a) => a.attemptNumber === attemptNumber
  );
  if (!attempt) {
    throw new Error(`Call attempt ${attemptNumber} not found`);
  }

  Object.assign(attempt, updateData);

  if (updateData.callStatus) {
    this.lastCallAttemptAt = new Date();
  }

  this.lastUpdated = new Date();
  return this.save();
};

// Method to schedule retry call
AbandonedCartSchema.methods.scheduleRetryCall = function (
  retryAt,
  correlationId,
  reason
) {
  const attemptNumber = this.callAttempts.length + 1;

  this.callAttempts.push({
    attemptNumber,
    scheduledAt: retryAt,
    correlationId,
    callStatus: "scheduled",
  });

  this.totalCallAttempts = attemptNumber;
  this.nextScheduledCallAt = retryAt;
  this.lastUpdated = new Date();

  // Add final action for the retry
  this.finalActions.push({
    actionCode: "scheduled_retry",
    actionTakenAt: new Date(),
    actionDetails: {
      reason,
      retryScheduledFor: retryAt,
      attemptNumber,
    },
    correlationId,
  });

  return this.save();
};

// Method to mark as do not call
AbandonedCartSchema.methods.markAsDoNotCall = function (correlationId, reason) {
  this.customerPreferences.doNotCall = true;
  this.nextScheduledCallAt = null;
  this.isActive = false;
  this.resolvedAt = new Date();

  this.finalActions.push({
    actionCode: "marked_dnc",
    actionTakenAt: new Date(),
    actionDetails: { reason },
    correlationId,
  });

  return this.save();
};

// Method to mark cart as recovered (purchased)
AbandonedCartSchema.methods.markAsRecovered = function (
  correlationId,
  details = {}
) {
  this.orderStage = "recovered";
  this.isActive = false;
  this.resolvedAt = new Date();
  this.nextScheduledCallAt = null;

  this.finalActions.push({
    actionCode: "order_completed",
    actionTakenAt: new Date(),
    actionDetails: details,
    correlationId,
  });

  return this.save();
};

// Method to send WhatsApp details
AbandonedCartSchema.methods.sendWhatsAppDetails = function (
  messageId,
  content,
  correlationId
) {
  this.whatsappDetails.sent = true;
  this.whatsappDetails.sentAt = new Date();
  this.whatsappDetails.messageId = messageId;
  this.whatsappDetails.content = content;
  this.whatsappDetails.deliveryStatus = "sent";

  this.finalActions.push({
    actionCode: "whatsapp_sent",
    actionTakenAt: new Date(),
    actionDetails: {
      messageId,
      content: content.substring(0, 100), // Store first 100 chars
    },
    correlationId,
  });

  return this.save();
};

// Static method to find carts ready for calling
AbandonedCartSchema.statics.findReadyForCalling = function () {
  const now = new Date();

  return this.find({
    isActive: true,
    nextScheduledCallAt: { $lte: now },
    "customerPreferences.doNotCall": { $ne: true },
  }).populate("agentId userId");
};

// Static method to find carts by correlation ID
AbandonedCartSchema.statics.findByCorrelationId = function (correlationId) {
  return this.findOne({
    $or: [
      { correlationId },
      { "callAttempts.correlationId": correlationId },
      { "finalActions.correlationId": correlationId },
    ],
  });
};

// Static method to get call statistics
AbandonedCartSchema.statics.getCallStats = function (userId, dateRange = {}) {
  const matchConditions = { userId };

  if (dateRange.start || dateRange.end) {
    matchConditions.abandonedAt = {};
    if (dateRange.start) matchConditions.abandonedAt.$gte = dateRange.start;
    if (dateRange.end) matchConditions.abandonedAt.$lte = dateRange.end;
  }

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalCarts: { $sum: 1 },
        recoveredCarts: {
          $sum: { $cond: [{ $eq: ["$orderStage", "recovered"] }, 1, 0] },
        },
        totalCallAttempts: { $sum: "$totalCallAttempts" },
        averageCallsPerCart: { $avg: "$totalCallAttempts" },
      },
    },
  ]);
};

const AbandonedCart =
  mongoose.models.AbandonedCart ||
  mongoose.model("AbandonedCart", AbandonedCartSchema);

export default AbandonedCart;
