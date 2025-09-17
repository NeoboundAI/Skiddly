import mongoose from "mongoose";
import { PLAN_CONFIGS, SUBSCRIPTION_STATUS } from "../constants/plans.js";

const userPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Plan Details
    plan: {
      type: String,
      enum: Object.keys(PLAN_CONFIGS),
      required: true,
    },

    // Billing Information
    billing: {
      type: {
        type: String,
        enum: [
          "trial",
          "fixed_schedule_fixed_amount",
          "fixed_schedule_variable_amount",
        ],
        default: "trial",
      },
      monthlyPrice: { type: Number, default: 0 },
      successBasedRate: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
      billingCycle: {
        type: String,
        enum: ["monthly", "yearly"],
        default: "monthly",
      },
    },

    // Razorpay Integration (ready for future implementation)
    razorpay: {
      customerId: { type: String },
      subscriptionId: { type: String },
      planId: { type: String },
      paymentMethod: { type: String },
      billingAddress: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
    },

    // Plan Dates
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    nextBillingDate: { type: Date },
    lastPaymentDate: { type: Date },

    // Trial Information
    trial: {
      startDate: { type: Date },
      endDate: { type: Date },
      isActive: { type: Boolean, default: true },
      duration: { type: Number, default: 7 }, // days
    },

    // Plan Status
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.TRIALING,
    },

    // Plan History
    history: [
      {
        plan: String,
        startDate: Date,
        endDate: Date,
        reason: String, // "upgrade", "downgrade", "cancellation", "trial_expired"
        price: Number,
        status: String,
      },
    ],

    // Custom Enterprise Features
    enterpriseFeatures: {
      customLimits: {
        abandonedCalls: { type: Number },
        abandonedSms: { type: Number },
        maxAgents: { type: Number },
        maxStores: { type: Number },
      },
      customPricing: {
        basePrice: { type: Number },
        perCallPrice: { type: Number },
        successBasedRate: { type: Number },
      },
      sla: {
        responseTime: { type: String },
        uptime: { type: Number },
        supportLevel: { type: String },
      },
    },

    // Plan Limits (denormalized for quick access)
    limits: {
      abandonedCalls: { type: Number, default: 25 },
      abandonedSms: { type: Number, default: 0 },
      maxAgents: { type: Number, default: 1 },
      maxStores: { type: Number, default: 1 },
      hasDedicatedNumber: { type: Boolean, default: false },
      hasApiAccess: { type: Boolean, default: false },
      hasMultiAgent: { type: Boolean, default: false },
    },

    // Current billing period limits (for quick access)
    currentPeriodLimits: {
      maxAbandonedCalls: { type: Number, default: 25 },
      maxAbandonedSms: { type: Number, default: 0 },
      periodStartDate: { type: Date, required: true },
      periodEndDate: { type: Date, required: true },
      isTrial: { type: Boolean, default: false },
    },

    // Metadata
    metadata: {
      createdBy: { type: String, default: "system" }, // "system", "admin", "user"
      notes: { type: String },
      tags: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
userPlanSchema.index({ userId: 1, status: 1 });
userPlanSchema.index({ razorpay: { subscriptionId: 1 } });
userPlanSchema.index({ nextBillingDate: 1 });
userPlanSchema.index({ "trial.endDate": 1 });
userPlanSchema.index({ plan: 1, status: 1 });

// Virtual for checking if trial is active
userPlanSchema.virtual("isTrialActive").get(function () {
  if (this.plan !== "free_trial") return false;
  if (!this.trial.isActive) return false;
  if (this.trial.endDate && new Date() > this.trial.endDate) return false;
  return true;
});

// Virtual for checking if plan is active
userPlanSchema.virtual("isActive").get(function () {
  return (
    this.status === SUBSCRIPTION_STATUS.ACTIVE ||
    (this.status === SUBSCRIPTION_STATUS.TRIALING && this.isTrialActive)
  );
});

// Method to get current plan limits
userPlanSchema.methods.getCurrentLimits = function () {
  return {
    abandonedCalls: this.limits.abandonedCalls,
    abandonedSms: this.limits.abandonedSms,
    maxAgents: this.limits.maxAgents,
    maxStores: this.limits.maxStores,
    hasDedicatedNumber: this.limits.hasDedicatedNumber,
    hasApiAccess: this.limits.hasApiAccess,
    hasMultiAgent: this.limits.hasMultiAgent,
  };
};

// Method to check if user can perform action
userPlanSchema.methods.canPerformAction = function (action, currentUsage = {}) {
  const limits = this.getCurrentLimits();

  switch (action) {
    case "make_call":
      if (this.plan === "free_trial" && !this.isTrialActive) {
        return { canPerform: false, reason: "trial_expired" };
      }
      if (
        limits.abandonedCalls !== -1 &&
        currentUsage.abandonedCalls >= limits.abandonedCalls
      ) {
        return { canPerform: false, reason: "abandoned_call_limit_reached" };
      }
      return { canPerform: true };

    case "create_agent":
      if (limits.maxAgents !== -1 && currentUsage.agents >= limits.maxAgents) {
        return { canPerform: false, reason: "max_agents_limit_reached" };
      }
      return { canPerform: true };

    case "connect_store":
      if (limits.maxStores !== -1 && currentUsage.stores >= limits.maxStores) {
        return { canPerform: false, reason: "max_stores_limit_reached" };
      }
      return { canPerform: true };

    default:
      return { canPerform: true };
  }
};

// Static method to create trial plan
userPlanSchema.statics.createTrialPlan = async function (userId) {
  const trialStartDate = new Date();
  const trialEndDate = new Date(
    trialStartDate.getTime() + 7 * 24 * 60 * 60 * 1000
  ); // 7 days

  const trialPlan = new this({
    userId,
    plan: "free_trial",
    billing: {
      type: "trial",
      monthlyPrice: 0,
      currency: "USD",
    },
    startDate: trialStartDate,
    trial: {
      startDate: trialStartDate,
      endDate: trialEndDate,
      isActive: true,
      duration: 7,
    },
    status: SUBSCRIPTION_STATUS.TRIALING,
    limits: PLAN_CONFIGS.free_trial,
    currentPeriodLimits: {
      maxAbandonedCalls: PLAN_CONFIGS.free_trial.abandonedCalls,
      maxAbandonedSms: PLAN_CONFIGS.free_trial.abandonedSms,
      periodStartDate: trialStartDate,
      periodEndDate: trialEndDate,
      isTrial: true,
    },
  });

  return await trialPlan.save();
};

// Static method to upgrade plan
userPlanSchema.statics.upgradePlan = async function (
  userId,
  newPlan,
  upgradeReason = "upgrade"
) {
  // End current plan
  const currentPlan = await this.findOne({
    userId,
    status: { $in: [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIALING] },
  });

  if (currentPlan) {
    currentPlan.status = SUBSCRIPTION_STATUS.CANCELED;
    currentPlan.endDate = new Date();
    currentPlan.history.push({
      plan: currentPlan.plan,
      startDate: currentPlan.startDate,
      endDate: currentPlan.endDate,
      reason: upgradeReason,
      price: currentPlan.billing.monthlyPrice,
      status: currentPlan.status,
    });
    await currentPlan.save();
  }

  // Create new plan
  const newPlanConfig = PLAN_CONFIGS[newPlan];
  const newPeriodStart = new Date();
  const newPeriodEnd = new Date(
    newPeriodStart.getTime() + 30 * 24 * 60 * 60 * 1000
  ); // 30 days for monthly plans

  const newUserPlan = new this({
    userId,
    plan: newPlan,
    billing: {
      type: newPlanConfig.billingType,
      monthlyPrice: newPlanConfig.monthlyPrice,
      successBasedRate: newPlanConfig.successBasedRate || 0,
      currency: newPlanConfig.currency,
    },
    startDate: newPeriodStart,
    endDate: newPeriodEnd,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    limits: newPlanConfig,
    currentPeriodLimits: {
      maxAbandonedCalls: newPlanConfig.abandonedCalls,
      maxAbandonedSms: newPlanConfig.abandonedSms,
      periodStartDate: newPeriodStart,
      periodEndDate: newPeriodEnd,
      isTrial: false,
    },
    history: [],
  });

  return await newUserPlan.save();
};

const UserPlan =
  mongoose.models.UserPlan || mongoose.model("UserPlan", userPlanSchema);

export default UserPlan;
