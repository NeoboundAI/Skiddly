import mongoose from "mongoose";

// Store categories options
export const STORE_CATEGORIES = [
  "Clothing",
  "Jewelry & Watches",
  "Home & Garden",
  "Fashion Accessories",
  "Health & Beauty",
  "Accessories",
  "Toys & Hobbies",
  "Shoes",
  "Books",
  "Food & Beverages",
  "Other Categories",
];

// Call logic condition types
export const CONDITION_TYPES = [
  "cart-value",
  "customer-type",
  "products",
  "previous-orders",
  "location",
  "coupon-code",
  "payment-method",
];

// Customer types for customer-type condition
export const CUSTOMER_TYPES = ["new", "returning", "guest"];

// Available operators for different condition types
export const CONDITION_OPERATORS = {
  "cart-value": [">=", "<=", ">", "<", "="],
  "customer-type": ["is", "is not"],
  products: ["includes", "excludes"],
  "previous-orders": [">=", "<=", ">", "<", "="],
  location: ["is", "is not"],
  "coupon-code": ["is", "is not"],
  "payment-method": ["is", "is not"],
};

// Time units for delays
export const TIME_UNITS = ["minutes", "hours", "days"];

// Common timezones
export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
];

// Return policy days options
export const RETURN_POLICY_DAYS = [7, 14, 21, 30, 45, 60, 90];

// Offer types
export const OFFER_TYPES = ["shippingDiscount", "paymentPlans"];

// Voice providers
export const VOICE_PROVIDERS = ["vapi", "elevenLabs"];

// Available languages
export const LANGUAGES = [
  "English (US)",
  "English (UK)",
  "English (AU)",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Chinese",
  "Japanese",
  "Korean",
  "Hindi",
];

// Greeting styles
export const GREETING_STYLES = ["standard", "casual", "custom"];

// Objection handling types
export const OBJECTION_TYPES = [
  "shippingCost",
  "price",
  "payment",
  "technical",
  "size",
  "comparison",
  "forgot",
];

// VAPI prompt keywords for objection handling
export const VAPI_OBJECTION_KEYWORDS = {
  shippingCost: "shippingResponse",
  price: "priceResponse",
  payment: "paymentResponse",
  technical: "technicalResponse",
  size: "sizeResponse",
  comparison: "comparisonResponse",
  forgot: "forgotResponse",
};

// Greeting templates for each style
export const GREETING_TEMPLATES = {
  standard:
    "Hi [Name], this is [Agent] from [Store]. I noticed you picked out [Product] but didn't get to checkout yet.",
  casual:
    "Hey [Name]! It's [Agent] from [Store]. Saw you were checking out some items - want to finish up real quick?",
  custom: "", // User will provide their own
};

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
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShopifyShop",

      default: null,
    },
    enabled: {
      type: Boolean,
      default: false,
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
          storeName: "",
          storeUrl: "",
          tagline: "",
          supportEmail: "",
          phoneNumber: "",
          businessAddress: "",
          businessHours: {
            monday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
            tuesday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
            wednesday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
            thursday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
            friday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
            saturday: { isOpen: false, startTime: "09:00", endTime: "18:00" },
            sunday: { isOpen: false, startTime: "09:00", endTime: "18:00" },
          },
          supportChannels: ["Email", "Chat", "Phone"],
          storeDescription: "",
          storeCategory: "",
          fulfillmentMethod: [],
        },

        // Step 2: Commerce Settings defaults
        commerceSettings: {
          checkoutProviders: {
            options: [
              "Shop Pay",
              "PayPal",
              "Google Pay",
              "Apple Pay",
              "Amazon Pay",
              "Meta Pay",
              "Venmo",
              "Klarna",
            ],
            selected: [],
          },
          cardsAccepted: {
            options: [
              "Visa",
              "Mastercard",
              "American Express",
              "Discover",
              "JCB",
              "Diners Club",
            ],
            selected: [],
          },
          buyNowPayLater: {
            options: ["Klarna", "Afterpay", "Affirm", "Sezzle", "Splitit"],
            selected: [],
          },
          discountCategories: {
            options: [
              "Military",
              "Student",
              "First Responder",
              "Newsletter",
              "Referral",
              "Senior",
              "Teacher",
            ],
            selected: [],
          },
          shippingMethods: {
            options: [
              "USPS",
              "UPS",
              "FedEx",
              "DHL",
              "Local Delivery",
              "Same Day Delivery",
            ],
            selected: [],
          },
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
              value: [],
              enabled: false,
            },
            {
              type: "products",
              operator: "includes",
              value: [],
              enabled: false,
            },
            {
              type: "previous-orders",
              operator: "<=",
              value: "5",
              enabled: false,
            },
            {
              type: "location",
              operator: "is",
              value: [],
              enabled: false,
            },
            {
              type: "coupon-code",
              operator: "is",
              value: [],
              enabled: false,
            },
            {
              type: "payment-method",
              operator: "is",
              value: [],
              enabled: false,
            },
          ],
          callSchedule: {
            waitTime: "30",
            waitTimeUnit: "minutes",
            maxRetries: 3,
            retryIntervals: [
              {
                attempt: 1,
                delay: 0,
                delayUnit: "minutes",
                description: "Immediately (as per your configuration)",
              },
              {
                attempt: 2,
                delay: 5,
                delayUnit: "minutes",
                description: "After 5 minutes from 1st attempt",
              },
              {
                attempt: 3,
                delay: 3,
                delayUnit: "hours",
                description: "After 3 hours from 2nd attempt",
              },
              {
                attempt: 4,
                delay: 1,
                delayUnit: "days",
                description: "Next day from 3rd attempt",
              },
              {
                attempt: 5,
                delay: 1,
                delayUnit: "days",
                description: "Following day from 4th attempt",
              },
              {
                attempt: 6,
                delay: 3,
                delayUnit: "days",
                description: "After 3 days from 5th attempt",
              },
            ],
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
          availableDiscounts: {
            enabled: false,
            selectedCodes: [],
            allCodes: [], // Will be populated from Shopify
          },
          availableOffers: {
            shippingDiscount: {
              enabled: false,
              description: "Offer free discounted shipping",
              customText: "",
            },
            paymentPlans: {
              enabled: false,
              description: "Offer payment plans - for high value carts",
              customText: "",
            },
          },
          returnPolicy: {
            enabled: false,
            days: 30,
            description: "30 days return",
          },
        },

        // Step 5: Agent Persona defaults
        agentPersona: {
          agentName: "Emma",
          language: "English (US)",
          voiceProvider: "vapi",
          voiceName: "sarah-professional-female",
          greetingStyle: {
            standard: {
              enabled: true,
              template:
                "Hi [Name], this is [Agent] from [Store]. I noticed you picked out [Product] but didn't get to checkout yet. Is this a good time to talk for a minute?",
            },
            casual: {
              enabled: false,
              template:
                "Hey [Name]! I'm [Agent] from [Store]. I saw you were looking at [Product] - want to chat about it?",
            },
            custom: {
              enabled: false,
              template: "",
            },
          },
        },

        // Step 6: Objection Handling defaults - All 8 conditions from VAPI
        objectionHandling: {
          "Shipping Cost Concern": {
            enabled: true,
            defaultEnabled: true,
            customEnabled: false,
            title: "Shipping Cost Concerns",
            subtitle: "When customer complaints about shipping cost.",
            default:
              "I completely understand — actually, we sometimes offer free or discounted shipping. Would it help if I sent you today's best shipping offer?",
            custom: "",
          },
          "Price Concern": {
            enabled: true,
            defaultEnabled: true,
            customEnabled: false,
            title: "Price of objections",
            subtitle: "When customer complaints about price.",
            default:
              "I hear you — pricing matters. I can check if there's any ongoing discount, or I can share a quick offer code you could use today: {{DiscountCode}}.",
            custom: "",
          },
          "Payment Issue": {
            enabled: true,
            defaultEnabled: true,
            customEnabled: false,
            title: "Payment concerns",
            subtitle: "When customer complaints about payment methods.",
            default:
              "Ah, that's frustrating. I can send you a quick payment link now on WhatsApp or SMS — it should only take a minute to complete your order.",
            custom: "",
          },
          "Technical Issues": {
            enabled: true,
            defaultEnabled: true,
            customEnabled: false,
            title: "Technical issues",
            subtitle: "When customer complaints about technical problems.",
            default:
              "I'm sorry you experienced that. Let me send you a direct checkout link that should work smoothly, or I can help you complete the order over the phone right now.",
            custom: "",
          },
          "Size/Fit Doubts (for fashion/apparel)": {
            enabled: true,
            defaultEnabled: true,
            customEnabled: false,
            title: "Size/Fit Concerns",
            subtitle: "When customer complaints about size or fit.",
            default:
              "Totally get it — fit is important. We have a quick size chart and easy exchange policy. Want me to text it to you?",
            custom: "",
          },
          "Comparison Shopping": {
            enabled: true,
            defaultEnabled: true,
            customEnabled: false,
            title: "Comparison Shopping",
            subtitle: "When customer is comparing with other stores.",
            default:
              "I understand you want to make sure you're getting the best deal. What I can offer you right now is {{DiscountCode}} which gives you [discount details], plus our quality guarantee.",
            custom: "",
          },
          "Just Forgot / Got Busy": {
            enabled: true,
            defaultEnabled: true,
            customEnabled: false,
            title: "Forgot to Complete",
            subtitle: "When customer forgot to complete purchase.",
            default:
              "No problem at all — I can send you the checkout link so you can finish whenever you're ready.",
            custom: "",
          },
          "Product Questions/Uncertainty": {
            enabled: true,
            defaultEnabled: true,
            customEnabled: false,
            title: "Product Questions/Uncertainty",
            subtitle: "When customer has questions about products.",
            default:
              "Great question about {{ProductNames}}. Let me share some quick details that might help: [provide relevant info]. Also, we have a great return policy if you're not completely satisfied.",
            custom: "",
          },
          "Wrong Item/Changed Mind": {
            enabled: true,
            defaultEnabled: true,
            customEnabled: false,
            title: "Wrong Item/Changed Mind",
            subtitle: "When customer wants to change or remove items.",
            default:
              "No worries at all. Would you like me to help you find something else from our collection that might be a better fit? Or shall I remove these items from your cart?",
            custom: "",
          },
        },

        // Step 7: Test & Launch defaults
        testLaunch: {
          isLive: false,
          connectedPhoneNumbers: [],
          connectedKnowledgeBase: {
            enabled: false,
            selectedBases: [],
          },
          policyLinks: {
            refundPolicy: "",
            cancellationPolicy: "",
            shippingPolicy: "",
            termsAndConditions: "",
            warranty: "",
          },
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

// Clear any existing model to avoid schema conflicts in development
if (mongoose.models.DefaultAgent) {
  delete mongoose.models.DefaultAgent;
}

const DefaultAgent = mongoose.model("DefaultAgent", defaultAgentSchema);

export default DefaultAgent;
