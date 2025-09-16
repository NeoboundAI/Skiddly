import mongoose from "mongoose";

const usageLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    userPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserPlan",
      required: true,
      index: true,
    },

    // Usage Details
    usage: {
      type: {
        type: String,
        enum: ["call", "sms", "agent_creation", "store_connection", "api_call"],
        required: true,
      },

      // Call specific
      callId: { type: String },
      duration: { type: Number }, // in seconds
      cost: { type: Number }, // in cents
      callStatus: { type: String },
      callOutcome: { type: String },

      // SMS specific
      smsId: { type: String },
      messageLength: { type: Number },
      smsStatus: { type: String },

      // Agent/Store specific
      resourceId: { type: String }, // agentId or storeId
      resourceType: { type: String }, // "agent" or "store"
      resourceName: { type: String },

      // API specific
      apiEndpoint: { type: String },
      requestSize: { type: Number },
      responseSize: { type: Number },
    },

    // Billing Information
    billing: {
      isBillable: { type: Boolean, default: true },
      amount: { type: Number, default: 0 }, // in cents
      currency: { type: String, default: "USD" },
      billingPeriod: { type: String }, // "2024-01"
      successBased: { type: Boolean, default: false },
      recoveredRevenue: { type: Number, default: 0 }, // for success-based billing
    },

    // Metadata
    metadata: {
      ipAddress: { type: String },
      userAgent: { type: String },
      correlationId: { type: String },
      sessionId: { type: String },
      deviceInfo: {
        type: String, // "web", "mobile", "api"
        platform: String,
        version: String,
      },
    },

    // Timestamps
    usageDate: { type: Date, default: Date.now, index: true },
    billingDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
usageLogSchema.index({ userId: 1, usageDate: 1 });
usageLogSchema.index({ userPlanId: 1, billingPeriod: 1 });
usageLogSchema.index({ "usage.type": 1, usageDate: 1 });
usageLogSchema.index({ "billing.billingPeriod": 1 });
usageLogSchema.index({ "usage.callId": 1 });
usageLogSchema.index({ "usage.resourceId": 1 });

// Virtual for formatted usage date
usageLogSchema.virtual("formattedUsageDate").get(function () {
  return this.usageDate.toISOString().split("T")[0];
});

// Static method to get usage summary for a user
usageLogSchema.statics.getUsageSummary = async function (
  userId,
  billingPeriod = null
) {
  const matchQuery = { userId };
  if (billingPeriod) {
    matchQuery["billing.billingPeriod"] = billingPeriod;
  }

  const summary = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$usage.type",
        count: { $sum: 1 },
        totalAmount: { $sum: "$billing.amount" },
        totalDuration: { $sum: "$usage.duration" },
        totalRecoveredRevenue: { $sum: "$billing.recoveredRevenue" },
      },
    },
  ]);

  return summary.reduce((acc, item) => {
    acc[item._id] = {
      count: item.count,
      totalAmount: item.totalAmount,
      totalDuration: item.totalDuration,
      totalRecoveredRevenue: item.totalRecoveredRevenue,
    };
    return acc;
  }, {});
};

// Static method to get monthly usage for a user
usageLogSchema.statics.getMonthlyUsage = async function (userId, year, month) {
  const billingPeriod = `${year}-${month.toString().padStart(2, "0")}`;
  return await this.getUsageSummary(userId, billingPeriod);
};

// Static method to track call usage
usageLogSchema.statics.trackCall = async function (
  userId,
  userPlanId,
  callData
) {
  const billingPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM format

  return await this.create({
    userId,
    userPlanId,
    usage: {
      type: "call",
      callId: callData.callId,
      duration: callData.duration || 0,
      cost: callData.cost || 0,
      callStatus: callData.callStatus,
      callOutcome: callData.callOutcome,
    },
    billing: {
      isBillable: true,
      amount: callData.cost || 0,
      billingPeriod,
      successBased: callData.successBased || false,
      recoveredRevenue: callData.recoveredRevenue || 0,
    },
    metadata: {
      correlationId: callData.correlationId,
    },
  });
};

// Static method to track agent creation
usageLogSchema.statics.trackAgentCreation = async function (
  userId,
  userPlanId,
  agentData
) {
  const billingPeriod = new Date().toISOString().slice(0, 7);

  return await this.create({
    userId,
    userPlanId,
    usage: {
      type: "agent_creation",
      resourceId: agentData.agentId,
      resourceType: "agent",
      resourceName: agentData.agentName,
    },
    billing: {
      isBillable: false, // Agent creation is not billable
      billingPeriod,
    },
    metadata: {
      correlationId: agentData.correlationId,
    },
  });
};

// Static method to track store connection
usageLogSchema.statics.trackStoreConnection = async function (
  userId,
  userPlanId,
  storeData
) {
  const billingPeriod = new Date().toISOString().slice(0, 7);

  return await this.create({
    userId,
    userPlanId,
    usage: {
      type: "store_connection",
      resourceId: storeData.storeId,
      resourceType: "store",
      resourceName: storeData.storeName,
    },
    billing: {
      isBillable: false, // Store connection is not billable
      billingPeriod,
    },
    metadata: {
      correlationId: storeData.correlationId,
    },
  });
};

const UsageLog =
  mongoose.models.UsageLog || mongoose.model("UsageLog", usageLogSchema);

export default UsageLog;
