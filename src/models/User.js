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
    plan: {
      type: String,
      enum: ["none", "free", "infrasonic", "ultrasonic"],
      default: "none",
    },
    credits: {
      type: Number,
      default: 0,
    },
    planDetails: {
      totalCredits: { type: Number, default: 0 },
      agentCreationLimit: { type: Number, default: 0 },
      dataRetentionDays: { type: Number, default: 0 },
      monthlyActiveUsers: { type: Number, default: 0 },
      planStartDate: { type: Date },
      planEndDate: { type: Date },
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
