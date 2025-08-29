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

    // Default configuration template for 7-step wizard
    defaultConfiguration: {
      type: Object,
      default: {
        // Step 1: Store Profile defaults
        storeProfile: {
          storeName: "Your Store Name",
          storeUrl: "your-store.myshopify.com",
          tagline: "Your store tagline",
          supportEmail: "support@yourstore.com",
          phoneNumber: "+1 (555) 123-4567",
          businessAddress: "123 Business St, City, State, ZIP",
          businessHours: "Mon-Fri, 9am-6pm",
          supportChannels: "Email, Chat, Phone",
          storeDescription: "Tell customers what makes your store special...",
          storeCategory: "Select a category",
          fulfillmentMethod: "shipping",
        },

        // Step 2: Commerce Settings defaults
        commerceSettings: {
          expressProviders: ["shop-pay", "paypal", "google-pay", "apple-pay"],
          paymentsAccepted: "Visa, Mastercard, Amex",
          bnplProviders: "Klarna, Afterpay",
          guestCheckoutEnabled: true,
          discountsNotes: "Student verified via SheerID.",
          discountTypes: [
            "military",
            "student",
            "first-responder",
            "newsletter",
          ],
          additionalNotes:
            "Apple Pay shows on Safari/iOS; Venmo via PayPal on mobile (US).",
        },

        // Step 3: Call Logic defaults
        callLogic: {
          conditions: [
            {
              type: "cart-value",
              operator: ">=",
              value: "50",
              enabled: true,
            },
            {
              type: "customer-type",
              operator: "is",
              value: "new",
              enabled: true,
            },
          ],
          callSchedule: {
            waitTime: "2",
            waitTimeUnit: "hours",
            maxRetries: "3",
            retryInterval: "24",
            retryIntervalUnit: "hours",
            weekendCalling: false,
            callTimeStart: "09:00",
            callTimeEnd: "18:00",
            timezone: "America/New_York",
            respectDND: true,
            voicemailDetection: true,
          },
        },

        // Step 4: Offer Engine defaults
        offerEngine: {
          shopifyDiscountCodes: [],
          primaryDiscountCode: "SAVE15",
          primaryDiscountValue: "15",
          offerShippingDiscount: true,
          shippingDiscountText: "Free shipping on orders over $50",
          offerPaymentPlans: true,
          returnPolicy: "30 days return",
        },

        // Step 5: Agent Persona defaults
        agentPersona: {
          agentName: "Sarah",
          language: "English (US)",
          voiceStyle: "sarah-professional-female",
          greetingStyle: "standard",
          customGreeting: "",
        },

        // Step 6: Objection Handling defaults
        objectionHandling: {
          shipping: true,
          price: true,
          size: true,
          payment: true,
          technical: true,
          comparison: true,
          forgot: true,
          shippingResponse:
            "We offer fast and reliable shipping with tracking.",
          priceResponse:
            "We have competitive pricing and often run special promotions.",
          sizeResponse:
            "We offer a wide range of sizes and easy returns if needed.",
          paymentResponse:
            "We accept all major credit cards and offer secure checkout.",
          technicalResponse:
            "Our customer support team is here to help with any issues.",
          comparisonResponse:
            "We're confident you'll find our quality and service exceptional.",
          forgotResponse:
            "No problem! I can help you complete your purchase quickly.",
        },

        // Step 7: Launch & Test defaults
        launchTest: {
          testCallsCompleted: 0,
          validationStatus: "pending",
          deploymentStatus: "draft",
          testResults: [],
        },
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
