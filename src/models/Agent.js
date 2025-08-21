import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vapiAgentId: {
      type: String,
      required: false, // Will be set when VAPI agent is created
    },
    assistantId: {
      type: String,
      required: false, // For linking to VAPI assistant templates
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["abandoned-cart", "customer-support", "custom"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "draft",
    },
    // Store configuration
    configuration: {
      storeName: String,
      storeCategory: String,
      storeDescription: String,
      agentName: String,
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
      customGreeting: String,
      discountCode: String,
      discountPercentage: String,
      hasShippingDiscount: {
        type: Boolean,
        default: false,
      },
      shippingDiscountAmount: String,
      hasPaymentPlans: {
        type: Boolean,
        default: false,
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
        cartValueMin: String,
        cartValueMax: String,
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
        shippingResponse: String,
        priceResponse: String,
        sizeResponse: String,
        paymentResponse: String,
        technicalResponse: String,
        comparisonResponse: String,
        forgotResponse: String,
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
    // VAPI Agent Configuration
    vapiConfiguration: {
      voice: {
        voiceId: String,
        provider: {
          type: String,
          default: "vapi",
        },
      },
      model: {
        model: String,
        provider: {
          type: String,
          default: "openai",
        },
        messages: [Object],
      },
      firstMessage: String,
      voicemailMessage: String,
      endCallMessage: String,
      transcriber: {
        model: {
          type: String,
          default: "nova-2",
        },
        language: {
          type: String,
          default: "en",
        },
        provider: {
          type: String,
          default: "deepgram",
        },
      },
      serverUrl: String,
      isServerUrlSecretSet: {
        type: Boolean,
        default: false,
      },
    },
    // Shopify integration
    shopifyShopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShopifyShop",
    },
    // Analytics
    totalCalls: {
      type: Number,
      default: 0,
    },
    successfulCalls: {
      type: Number,
      default: 0,
    },
    recoveredCarts: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
agentSchema.index({ userId: 1, type: 1 });
agentSchema.index({ vapiAgentId: 1 });
agentSchema.index({ assistantId: 1 });

const Agent = mongoose.models.Agent || mongoose.model("Agent", agentSchema);

export default Agent;
