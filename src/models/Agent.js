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
        required: true,
      },
      storeUrl: {
        type: String,
        required: true,
      },
      tagline: String,

      // Contact Information
      supportEmail: {
        type: String,
        required: true,
      },
      phoneNumber: String,
      businessAddress: String,
      businessHours: String,
      supportChannels: String,

      // Store Details
      storeDescription: String,
      storeCategory: String,

      // Fulfillment Method
      fulfillmentMethod: {
        type: String,
        enum: ["shipping", "local-pickup"],
        default: "shipping",
      },
    },

    // Step 2: Commerce Settings
    commerceSettings: {
      // Express Providers
      expressProviders: [
        {
          type: String,
          enum: [
            "shop-pay",
            "paypal",
            "google-pay",
            "apple-pay",
            "amazon-pay",
            "meta-pay",
            "venmo",
            "klarna",
          ],
        },
      ],

      // Payments Accepted
      paymentsAccepted: String, // comma-separated list

      // BNPL (Buy Now Pay Later)
      bnplProviders: String, // comma-separated list

      // Guest Checkout
      guestCheckoutEnabled: {
        type: Boolean,
        default: true,
      },

      // Discounts & Notes
      discountsNotes: String,
      discountTypes: [
        {
          type: String,
          enum: [
            "military",
            "student",
            "first-responder",
            "newsletter",
            "referral",
          ],
        },
      ],

      // Additional Notes
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
              "products",
              "customer-type",
              "previous-orders",
              "location",
              "coupon-code",
              "payment-method",
            ],
          },
          operator: {
            type: String,
            enum: [">=", "<=", "==", "!=", "includes", "is"],
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
          default: "2",
        },
        waitTimeUnit: {
          type: String,
          default: "hours",
        },
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
    },

    // Step 4: Offer Engine
    offerEngine: {
      // Shopify Discount Codes
      shopifyDiscountCodes: [
        {
          code: String,
          type: String, // "percentage", "fixed", etc.
          value: String,
          status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
          },
          expiresAt: Date,
        },
      ],

      // Primary Discount Code (Manual Entry)
      primaryDiscountCode: String,
      primaryDiscountValue: String,

      // Shipping Offers
      offerShippingDiscount: {
        type: Boolean,
        default: false,
      },
      shippingDiscountText: String,

      // Payment Plans
      offerPaymentPlans: {
        type: Boolean,
        default: false,
      },

      // Return Policy
      returnPolicy: {
        type: String,
        default: "30 days return",
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
      voiceStyle: {
        type: String,
        enum: [
          "sarah-professional-female",
          "mike-friendly-male",
          "emma-warm-female",
          "david-confident-male",
        ],
        default: "sarah-professional-female",
      },
      greetingStyle: {
        type: String,
        enum: ["standard", "casual", "custom"],
        default: "standard",
      },
      customGreeting: String,
    },

    // Step 6: Objection Handling (already exists, keeping as is)
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

    // Step 7: Launch & Test
    launchTest: {
      testCallsCompleted: {
        type: Number,
        default: 0,
      },
      validationStatus: {
        type: String,
        enum: ["pending", "validated", "failed"],
        default: "pending",
      },
      deploymentStatus: {
        type: String,
        enum: ["draft", "testing", "live", "paused"],
        default: "draft",
      },
      lastTestCall: Date,
      testResults: [
        {
          testType: String,
          status: String,
          timestamp: Date,
          notes: String,
        },
      ],
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
