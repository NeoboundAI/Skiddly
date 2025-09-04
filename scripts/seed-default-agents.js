import mongoose from "mongoose";
import DefaultAgent from "../src/models/DefaultAgent.js";
import connectDB from "../src/lib/mongodb.js";

// Store categories options
const STORE_CATEGORIES = [
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
const CONDITION_TYPES = [
  "cart-value",
  "customer-type",
  "products",
  "previous-orders",
  "location",
  "coupon-code",
  "payment-method",
];

// Customer types for customer-type condition
const CUSTOMER_TYPES = ["new", "returning", "guest"];

// Time units for delays
const TIME_UNITS = ["minutes", "hours", "days"];

// Common timezones
const TIMEZONES = [
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
const RETURN_POLICY_DAYS = [7, 14, 21, 30, 45, 60, 90];

// Offer types
const OFFER_TYPES = ["shippingDiscount", "paymentPlans"];

// Voice providers
const VOICE_PROVIDERS = ["vapi", "elevenLabs"];

// Available languages
const LANGUAGES = [
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
const GREETING_STYLES = ["standard", "casual", "custom"];

// Objection handling types
const OBJECTION_TYPES = [
  "shippingCost",
  "price",
  "payment",
  "technical",
  "size",
  "comparison",
  "forgot",
];

// VAPI prompt keywords for objection handling
const VAPI_OBJECTION_KEYWORDS = {
  shippingCost: "shippingResponse",
  price: "priceResponse",
  payment: "paymentResponse",
  technical: "technicalResponse",
  size: "sizeResponse",
  comparison: "comparisonResponse",
  forgot: "forgotResponse",
};

// Greeting templates for each style
const GREETING_TEMPLATES = {
  standard:
    "Hi [Name], this is [Agent] from [Store]. I noticed you picked out [Product] but didn't get to checkout yet.",
  casual:
    "Hey [Name]! It's [Agent] from [Store]. Saw you were checking out some items - want to finish up real quick?",
  custom: "", // User will provide their own
};

const defaultAgents = [
  {
    name: "Abandoned Cart Recovery Agent",
    description:
      "Automatically calls customers who left items in their cart to help them complete their purchase",
    type: "abandoned-cart",
    category: "Sales Recovery",
    languages: "English (US)",
    enabled: true,
    assistantId: "asst_abandoned_cart_recovery",
    defaultConfiguration: {
      // Step 1: Store Profile
      storeProfile: {
        storeName: "Your Store",
        storeUrl: "your-store.myshopify.com",
        tagline: "Quality products for everyone",
        supportEmail: "support@yourstore.com",
        phoneNumber: "+1 (555) 123-4567",
        businessAddress: "123 Main St, City, State 12345",
        businessHours: {
          monday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
          tuesday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
          wednesday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
          thursday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
          friday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
          saturday: { isOpen: false, startTime: "09:00", endTime: "18:00" },
          sunday: { isOpen: false, startTime: "09:00", endTime: "18:00" },
        },
        supportChannels: ["Email", "Phone", "Chat"],
        storeDescription:
          "We offer high-quality products with excellent customer service and fast shipping.",
        storeCategory: "",
        fulfillmentMethod: ["shipping", "pickup"],
      },

      // Step 2: Commerce Settings
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
        guestCheckoutEnabled: true,
        additionalNotes:
          "Apple Pay available on iOS devices, Google Pay on Android",
      },

      // Step 3: Call Logic
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

      // Step 4: Offer Engine
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

      // Step 5: Agent Persona
      agentPersona: {
        agentName: "Emma",
        language: "English (US)",
        voiceProvider: "vapi",
        voiceName: "sarah-professional-female",
        greetingStyle: "standard",
        greetingTemplate:
          "Hi [Name], this is [Agent] from [Store]. I noticed you picked out [Product] but didn't get to checkout yet.",
        customGreeting: "",
      },

      // Step 6: Objection Handling - All 8 conditions from VAPI with default/custom structure
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

      // Step 7: Test & Launch
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
  {
    name: "Customer Support Agent",
    description:
      "Provides automated customer support for common questions and issues",
    type: "customer-support",
    category: "Customer Service",
    languages: "English (US)",
    enabled: true,
    assistantId: "asst_customer_support",
    defaultConfiguration: {
      // Step 1: Store Profile
      storeProfile: {
        storeName: "Your Store",
        storeUrl: "your-store.myshopify.com",
        tagline: "Quality products for everyone",
        supportEmail: "support@yourstore.com",
        phoneNumber: "+1 (555) 123-4567",
        businessAddress: "123 Main St, City, State 12345",
        businessHours: {
          monday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
          tuesday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
          wednesday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
          thursday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
          friday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
          saturday: { isOpen: false, startTime: "09:00", endTime: "18:00" },
          sunday: { isOpen: false, startTime: "09:00", endTime: "18:00" },
        },
        supportChannels: ["Email", "Phone", "Chat"],
        storeDescription:
          "We offer high-quality products with excellent customer service and fast shipping.",
        storeCategory: "",
        fulfillmentMethod: ["shipping", "pickup"],
      },

      // Step 2: Commerce Settings
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
        guestCheckoutEnabled: true,
        additionalNotes:
          "Apple Pay available on iOS devices, Google Pay on Android",
      },

      // Step 3: Call Logic
      callLogic: {
        conditions: [
          {
            type: "customer-type",
            operator: "is",
            value: "all",
            enabled: true,
          },
        ],
        callSchedule: {
          waitTime: "30",
          waitTimeUnit: "minutes",
          maxRetries: 2,
          retryIntervals: [
            {
              attempt: 1,
              delay: 0,
              delayUnit: "minutes",
              description: "Immediately (as per your configuration)",
            },
            {
              attempt: 2,
              delay: 1,
              delayUnit: "hours",
              description: "After 1 hour from 1st attempt",
            },
            {
              attempt: 3,
              delay: 12,
              delayUnit: "hours",
              description: "After 12 hours from 2nd attempt",
            },
          ],
          weekendCalling: true,
          callTimeStart: "08:00",
          callTimeEnd: "20:00",
          timezone: "America/New_York",
          respectDND: true,
          voicemailDetection: true,
        },
      },

      // Step 4: Offer Engine
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

      // Step 5: Agent Persona
      agentPersona: {
        agentName: "Emma",
        language: "English (US)",
        voiceProvider: "vapi",
        voiceName: "mike-friendly-male",
        greetingStyle: "casual",
        greetingTemplate:
          "Hey [Name]! It's [Agent] from [Store]. Saw you were checking out some items - want to finish up real quick?",
        customGreeting: "",
      },

      // Step 6: Objection Handling - All 8 conditions from VAPI with default/custom structure
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
          enabled: false,
          defaultEnabled: true,
          customEnabled: false,
          title: "Comparison Shopping",
          subtitle: "When customer is comparing with other stores.",
          default:
            "I understand you want to make sure you're getting the best deal. What I can offer you right now is {{DiscountCode}} which gives you [discount details], plus our quality guarantee.",
          custom: "",
        },
        "Just Forgot / Got Busy": {
          enabled: false,
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

      // Step 7: Test & Launch
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
  {
    name: "High-Value Cart Agent",
    description:
      "Specialized agent for high-value carts with premium service and exclusive offers",
    type: "abandoned-cart",
    category: "Premium Sales",
    languages: "English (US)",
    enabled: true,
    assistantId: "asst_high_value_cart",
    defaultConfiguration: {
      // Step 1: Store Profile
      storeProfile: {
        storeName: "Your Premium Store",
        storeUrl: "your-premium-store.myshopify.com",
        tagline: "Premium products for discerning customers",
        supportEmail: "premium@yourstore.com",
        phoneNumber: "+1 (555) 123-4567",
        businessAddress: "123 Main St, City, State 12345",
        businessHours: {
          monday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
          tuesday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
          wednesday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
          thursday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
          friday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
          saturday: { isOpen: false, startTime: "09:00", endTime: "18:00" },
          sunday: { isOpen: false, startTime: "09:00", endTime: "18:00" },
        },
        supportChannels: ["Email", "Phone", "Chat", "Concierge"],
        storeDescription:
          "We offer premium products with white-glove service and exclusive benefits for our valued customers.",
        storeCategory: "",
        fulfillmentMethod: ["shipping", "pickup"],
      },

      // Step 2: Commerce Settings
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
        guestCheckoutEnabled: false,
        additionalNotes:
          "Premium customers get priority support and exclusive payment options",
      },

      // Step 3: Call Logic
      callLogic: {
        conditions: [
          {
            type: "cart-value",
            operator: ">=",
            value: "500",
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
          maxRetries: 5,
          retryIntervals: [
            {
              attempt: 1,
              delay: 0,
              delayUnit: "minutes",
              description: "Immediately (as per your configuration)",
            },
            {
              attempt: 2,
              delay: 2,
              delayUnit: "hours",
              description: "After 2 hours from 1st attempt",
            },
            {
              attempt: 3,
              delay: 6,
              delayUnit: "hours",
              description: "After 6 hours from 2nd attempt",
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
              delay: 2,
              delayUnit: "days",
              description: "After 2 days from 5th attempt",
            },
          ],
          weekendCalling: true,
          callTimeStart: "08:00",
          callTimeEnd: "21:00",
          timezone: "America/New_York",
          respectDND: true,
          voicemailDetection: true,
        },
      },

      // Step 4: Offer Engine
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
          days: 60,
          description: "60 days return with free shipping",
        },
      },

      // Step 5: Agent Persona
      agentPersona: {
        agentName: "Emma",
        language: "English (US)",
        voiceProvider: "vapi",
        voiceName: "emma-warm-female",
        greetingStyle: "custom",
        greetingTemplate: "",
        customGreeting:
          "Hello [Name], this is Emma from [Store]. I noticed you have some premium items in your cart and I wanted to personally assist you with completing your purchase. As a valued customer, I'm here to ensure you have an exceptional experience.",
      },

      // Step 6: Objection Handling
      objectionHandling: {
        shippingCost: {
          enabled: true,
          title: "Shipping Cost Concerns",
          subtitle: "When customer complaints about shipping cost.",
          response:
            "We offer premium shipping with full tracking and insurance. Most orders arrive within 1-2 business days with our express service.",
        },
        price: {
          enabled: true,
          title: "Price of objections",
          subtitle: "When customer complaints about price.",
          response:
            "Our premium products offer exceptional value and quality. Plus, as a VIP customer, you have access to exclusive pricing and special offers.",
        },
        payment: {
          enabled: true,
          title: "Payment concerns",
          subtitle: "When customer complaints about payment methods.",
          response:
            "We accept all major credit cards and offer secure checkout. Premium customers also have access to special financing options.",
        },
        technical: {
          enabled: true,
          title: "Technical issues",
          subtitle: "When customer complaints about technical problems.",
          response:
            "Our premium support team is available 24/7 to assist you. You'll have a dedicated account manager for personalized service.",
        },
        size: {
          enabled: true,
          title: "Size/Fit Concerns",
          subtitle: "When customer complaints about size or fit.",
          response:
            "We offer comprehensive sizing guides and free exchanges. Our premium service includes personal fitting consultations if needed.",
        },
        comparison: {
          enabled: true,
          title: "Comparison Shopping",
          subtitle: "When customer is comparing with other stores.",
          response:
            "Our premium products are crafted with the finest materials and backed by our exceptional service guarantee. We're confident you'll find our quality unmatched.",
        },
        forgot: {
          enabled: true,
          title: "Forgot to Complete",
          subtitle: "When customer forgot to complete purchase.",
          response:
            "No worries at all! I'm here to personally assist you with completing your premium purchase. Your cart is saved and ready to go.",
        },
      },

      // Step 7: Test & Launch
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
];

async function seedDefaultAgents() {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    // Clear existing default agents
    await DefaultAgent.deleteMany({});
    console.log("Cleared existing default agents");

    // Insert new default agents
    const insertedAgents = await DefaultAgent.insertMany(defaultAgents);
    console.log(`Successfully seeded ${insertedAgents.length} default agents:`);

    insertedAgents.forEach((agent) => {
      console.log(`- ${agent.name} (${agent.type})`);
    });

    console.log("\nDefault agents seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding default agents:", error);
    process.exit(1);
  }
}

// Run the seeding function
seedDefaultAgents();
