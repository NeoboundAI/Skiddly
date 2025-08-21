import mongoose from "mongoose";

const defaultAgentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["abandoned-cart", "customer-support", "custom"],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    languages: {
      type: String,
      default: "Hindi / English",
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    assistantId: {
      type: String,
      required: true, // VAPI assistant ID to fetch configuration from
    },
    // Default configuration template
    defaultConfiguration: {
      language: {
        type: String,
        default: "en-US",
      },
      voiceStyle: {
        type: String,
        default: "professional-female",
      },
      greeting: {
        type: String,
        default: "standard",
      },
      returnPolicy: {
        type: String,
        default: "30 days",
      },
      callTriggers: {
        abandonedCart: {
          type: Boolean,
          default: true,
        },
        waitTime: {
          type: String,
          default: "2",
        },
        waitTimeUnit: {
          type: String,
          default: "hours",
        },
      },
      callSettings: {
        maxRetries: {
          type: String,
          default: "3",
        },
        retryInterval: {
          type: String,
          default: "24",
        },
        retryIntervalUnit: {
          type: String,
          default: "hours",
        },
        weekendCalling: {
          type: Boolean,
          default: false,
        },
        callTimeStart: {
          type: String,
          default: "09:00",
        },
        callTimeEnd: {
          type: String,
          default: "18:00",
        },
        timezone: {
          type: String,
          default: "America/New_York",
        },
        respectDND: {
          type: Boolean,
          default: true,
        },
        voicemailDetection: {
          type: Boolean,
          default: true,
        },
      },
      objectionHandling: {
        shipping: {
          type: Boolean,
          default: true,
        },
        price: {
          type: Boolean,
          default: true,
        },
        size: {
          type: Boolean,
          default: true,
        },
        payment: {
          type: Boolean,
          default: true,
        },
        technical: {
          type: Boolean,
          default: true,
        },
        comparison: {
          type: Boolean,
          default: true,
        },
        forgot: {
          type: Boolean,
          default: true,
        },
      },
      enableSmartEscalation: {
        type: Boolean,
        default: false,
      },
      enableFollowUp: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
defaultAgentSchema.index({ type: 1, enabled: 1 });
defaultAgentSchema.index({ assistantId: 1 });

const DefaultAgent =
  mongoose.models.DefaultAgent ||
  mongoose.model("DefaultAgent", defaultAgentSchema);

export default DefaultAgent;
