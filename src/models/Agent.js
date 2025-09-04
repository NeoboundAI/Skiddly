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

    // Step 1: Store Profile
    storeProfile: {
      // Store Identity
      storeName: {
        type: String,
       
      },
      storeUrl: {
        type: String,
        
      },
      tagline: String,

      // Contact Information
      supportEmail: {
        type: String,
        
      },
      phoneNumber: String,
      businessAddress: String,
      businessHours: {
        monday: { isOpen: Boolean, startTime: String, endTime: String },
        tuesday: { isOpen: Boolean, startTime: String, endTime: String },
        wednesday: { isOpen: Boolean, startTime: String, endTime: String },
        thursday: { isOpen: Boolean, startTime: String, endTime: String },
        friday: { isOpen: Boolean, startTime: String, endTime: String },
        saturday: { isOpen: Boolean, startTime: String, endTime: String },
        sunday: { isOpen: Boolean, startTime: String, endTime: String },
      },
      supportChannels: [String],

      // Store Details
      storeDescription: String,
      storeCategory: String,

      // Fulfillment Method
      fulfillmentMethod: [String],
    },

    // Step 2: Commerce Settings
    commerceSettings: {
      checkoutProviders: {
        options: [String],
        selected: [String],
      },
      cardsAccepted: {
        options: [String],
        selected: [String],
      },
      buyNowPayLater: {
        options: [String],
        selected: [String],
      },
      discountCategories: {
        options: [String],
        selected: [String],
      },
      shippingMethods: {
        options: [String],
        selected: [String],
      },
      guestCheckoutEnabled: {
        type: Boolean,
        default: true,
      },
      additionalNotes: String,
    },

    // Step 3: Call Logic
    callLogic: {
      // Call Conditions (AND/OR logic)
      conditions: [
        {
          type: {
            type: String,
            enum: [
              "cart-value",
              "customer-type",
              "products",
              "previous-orders",
              "location",
              "coupon-code",
              "payment-method",
            ],
          },
          operator: {
            type: String,
            enum: [
              ">=",
              "<=",
              ">",
              "<",
              "=",
              "is",
              "is not",
              "includes",
              "excludes",
            ],
          },
          value: mongoose.Schema.Types.Mixed, // Can be string, number, or array
          enabled: {
            type: Boolean,
            default: true,
          },
        },
      ],

      // Call Schedule
      callSchedule: {
        waitTime: {
          type: String,
          default: "30",
        },
        waitTimeUnit: {
          type: String,
          default: "minutes",
        },
        maxRetries: {
          type: Number,
          default: 3,
        },
        retryIntervals: [
          {
            attempt: Number,
            delay: Number,
            delayUnit: String,
            description: String,
          },
        ],
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
    },

    // Step 4: Offer Engine
    offerEngine: {
      availableDiscounts: {
        enabled: {
          type: Boolean,
          default: false,
        },
        selectedCodes: [String],
        allCodes: [String],
      },
      availableOffers: {
        shippingDiscount: {
          enabled: {
            type: Boolean,
            default: false,
          },
          description: String,
          customText: String,
        },
        paymentPlans: {
          enabled: {
            type: Boolean,
            default: false,
          },
          description: String,
          customText: String,
        },
      },
      returnPolicy: {
        enabled: {
          type: Boolean,
          default: false,
        },
        days: {
          type: Number,
          default: 30,
        },
        description: String,
      },
    },

    // Step 5: Agent Persona
    agentPersona: {
      agentName: {
        type: String,
        required: true,
      },
      language: {
        type: String,
        default: "English (US)",
      },
      voiceProvider: {
        type: String,
      },
      voiceName: {
        type: String,
        default: "sarah-professional-female",
      },
      greetingStyle: {
        type: String,
        enum: ["standard", "casual", "custom"],
        default: "standard",
      },
      greetingTemplate: String,
      customGreeting: String,
    },

    // Step 6: Objection Handling - All 8 conditions from VAPI with default/custom structure
    objectionHandling: {
      type: Map,
      of: {
        enabled: {
          type: Boolean,
          default: true,
        },
        defaultEnabled: {
          type: Boolean,
          default: true,
        },
        customEnabled: {
          type: Boolean,
          default: false,
        },
        title: String,
        subtitle: String,
        default: String,
        custom: String,
      },
    },

    // Step 7: Test & Launch
    testLaunch: {
      isLive: {
        type: Boolean,
        default: false,
      },
      connectedPhoneNumbers: [String],
      connectedKnowledgeBase: {
        enabled: {
          type: Boolean,
          default: false,
        },
        selectedBases: [String],
      },
      policyLinks: {
        refundPolicy: String,
        cancellationPolicy: String,
        shippingPolicy: String,
        termsAndConditions: String,
        warranty: String,
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

// Clear any existing model to avoid schema conflicts in development
if (mongoose.models.Agent) {
  delete mongoose.models.Agent;
}

const Agent = mongoose.model("Agent", agentSchema);

export default Agent;
