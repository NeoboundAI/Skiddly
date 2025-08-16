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
    shopify: {
      shop: String,
      accessToken: String,
      scope: String,
      state: String,
      isActive: {
        type: Boolean,
        default: false,
      },
      connectedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
