import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
    },
    password: {
      type: String,
    },
    image: {
      type: String,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin", "super_admin"],
      default: "user",
    },
    permissions: {
      viewLogs: { type: Boolean, default: false },
      manageUsers: { type: Boolean, default: false },
      manageAdmins: { type: Boolean, default: false },
      viewAnalytics: { type: Boolean, default: false },
      systemSettings: { type: Boolean, default: false },
    },
    otp: {
      code: String,
      expiresAt: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    provider: {
      type: String,
      default: "credentials",
    },
    // Subscription Information (denormalized for quick access)
    subscription: {
      plan: {
        type: String,
        enum: ["free_trial", "starter", "growth", "scale", "enterprise"],
        default: "free_trial",
      },
      status: {
        type: String,
        enum: ["active", "trialing", "past_due", "canceled", "paused"],
        default: "trialing",
      },

      // Quick access limits (denormalized from UserPlan)
      limits: {
        abandonedCalls: { type: Number, default: 25 },
        abandonedSms: { type: Number, default: 0 },
        maxAgents: { type: Number, default: 1 },
        maxStores: { type: Number, default: 1 },
        hasDedicatedNumber: { type: Boolean, default: false },
        hasApiAccess: { type: Boolean, default: false },
        hasMultiAgent: { type: Boolean, default: false },
      },

      // Current billing period info (denormalized)
      currentBillingPeriod: {
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date },
        isTrial: { type: Boolean, default: true },
        maxAbandonedCalls: { type: Number, default: 25 },
        maxAbandonedSms: { type: Number, default: 0 },
      },

      // Current period usage (denormalized)
      currentPeriodUsage: {
        abandonedCallsUsed: { type: Number, default: 0 },
        abandonedSmsUsed: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now },
      },

      // Reference to UserPlan for detailed tracking
      userPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "UserPlan" },

      // Trial info
      trialEndDate: { type: Date },
      isTrialActive: { type: Boolean, default: true },

      // Quick billing info
      nextBillingDate: { type: Date },
      lastPaymentDate: { type: Date },
      monthlyPrice: { type: Number, default: 0 },
    },
    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
