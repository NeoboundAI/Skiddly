import mongoose from "mongoose";
import {
  CALL_STATUS,
  ALL_CALL_OUTCOMES,
  ALL_FINAL_ACTIONS,
} from "../constants/callConstants.js";

const CallSchema = new mongoose.Schema(
  {
    // VAPI call ID
    callId: {
      type: String,
      required: true,
      unique: true,
    },

    // Reference to user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Reference to abandoned cart
    abandonedCartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AbandonedCart",
      required: true,
    },

    // Reference to agent
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },

    // Reference to cart
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
    },

    // VAPI assistant ID
    assistantId: {
      type: String,
      required: true,
    },

    // Customer phone number
    customerNumber: {
      type: String,
      required: true,
    },

    // Call status from VAPI
    callStatus: {
      type: String,
      enum: Object.values(CALL_STATUS),
      default: CALL_STATUS.QUEUED,
    },

    callOutcome: {
      type: String,
      enum: Object.values(ALL_CALL_OUTCOMES),
      default: null,
    },

    finalAction: {
      type: String,
      enum: Object.values(ALL_FINAL_ACTIONS),
      default: null,
    },

    // Raw call end reason from provider
    providerEndReason: {
      type: String,
      default: "initiated",
    },

    // Why the call ended (processed/standardized)
    endedReason: {
      type: String,
      enum: [
        "initiated",
        "customer-ended-call",
        "customer-did-not-answer",
        "customer-busy",
        "assistant-ended-call",
        "assistant-request-failed",
        "assistant-not-found",
        "db-error",
        "no-server-available",
        "pipeline-error-openai-llm-failed",
        "pipeline-error-azure-voice-failed",
        "pipeline-error-cartesia-voice-failed",
        "pipeline-error-deepgram-transcriber-failed",
        "pipeline-error-gladia-transcriber-failed",
        "pipeline-error-eleven-labs-voice-failed",
        "pipeline-error-playht-voice-failed",
        "pipeline-error-lmnt-voice-failed",
        "pipeline-error-openai-voice-failed",
        "pipeline-error-neets-voice-failed",
        "pipeline-error-rime-ai-voice-failed",
        "worker-shutdown",
        "unknown-error",
        "vonage-rejected",
        "vonage-disconnected",
        "vonage-failed-to-connect-call",
        "phone-call-provider-bypass-enabled-but-no-call-received",
        "vapifault",
        "assistant-not-invalid",
        "assistant-not-provided",
        "call-start-error-neither-assistant-nor-squad-provided",
        "timeout",
        "exceeded-max-duration",
        "no-valid-payment-method",
        "exceeded-max-cost",
        "model-output-too-long",
        "pipeline-error-model-output-too-long",
      ],
      default: "initiated",
    },

    // Call cost in cents
    cost: {
      type: Number,
      default: 0,
    },

    // Duration in seconds
    duration: {
      type: Number,
      default: 0,
    },

    // Whether call was picked up
    picked: {
      type: Boolean,
      default: false,
    },

    vapiCallId: {
      type: String,
      default: null,
    },

    // Call transcript (if available)
    transcript: {
      type: String,
      default: null,
    },

    // Call summary (if available)
    summary: {
      type: String,
      default: null,
    },

    // Recording URL (if available)
    recordingUrl: {
      type: String,
      default: null,
    },

    // Analysis of the call
    analysis: {
      callResult: {
        type: String,
        enum: ["successful", "no-answer", "busy", "failed", "voicemail"],
        default: null,
      },
      customerInterest: {
        type: String,
        enum: ["high", "medium", "low", "none"],
        default: null,
      },
      nextAction: {
        type: String,
        enum: ["completed", "reschedule", "no-follow-up"],
        default: null,
      },
      rescheduleTime: {
        type: Date,
        default: null,
      },
    },

    // Correlation ID for tracing
    correlationId: {
      type: String,
      required: true,
    },

    // Next call time for retry attempts
    nextCallTime: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
CallSchema.index({ userId: 1, status: 1 });
CallSchema.index({ agentId: 1, status: 1 });
CallSchema.index({ abandonedCartId: 1 });
CallSchema.index({ cartId: 1 });
CallSchema.index({ callId: 1 });
CallSchema.index({ correlationId: 1 });
CallSchema.index({ customerNumber: 1 });
CallSchema.index({ createdAt: -1 });

const Call = mongoose.models.Call || mongoose.model("Call", CallSchema);

export default Call;
