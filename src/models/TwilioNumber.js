import mongoose from "mongoose";

const twilioNumberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    sid: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["own", "free"],
      default: "own",
    },
    maxCalls: {
      type: Number,
      default: 0,
    },
    callsUsed: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    // VAPI Integration Fields
    vapiNumberId: {
      type: String,
      required: false, // Only required for own numbers
    },
    vapiOrgId: {
      type: String,
      required: false, // Only required for own numbers
    },
    vapiStatus: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const TwilioNumber =
  mongoose.models.TwilioNumber ||
  mongoose.model("TwilioNumber", twilioNumberSchema);

export default TwilioNumber;
