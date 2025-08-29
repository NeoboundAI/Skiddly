import mongoose from "mongoose";
import DefaultAgent from "../src/models/DefaultAgent.js";
import connectDB from "../src/lib/mongodb.js";

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
        businessHours: "Mon-Fri, 9am-6pm EST",
        supportChannels: "Email, Phone, Chat",
        storeDescription:
          "We offer high-quality products with excellent customer service and fast shipping.",
        storeCategory: "general",
        fulfillmentMethod: "shipping",
      },

      // Step 2: Commerce Settings
      commerceSettings: {
        expressProviders: ["shop-pay", "paypal", "google-pay", "apple-pay"],
        paymentsAccepted: "Visa, Mastercard, American Express, Discover",
        bnplProviders: "Klarna, Afterpay, Affirm",
        guestCheckoutEnabled: true,
        discountsNotes: "Student discounts available with valid ID",
        discountTypes: ["military", "student", "first-responder", "newsletter"],
        additionalNotes:
          "Apple Pay available on iOS devices, Google Pay on Android",
      },

      // Step 3: Call Logic
      callLogic: {
        conditions: [
          {
            type: "cart-value",
            operator: ">=",
            value: "25",
            enabled: true,
          },
          {
            type: "customer-type",
            operator: "is",
            value: "returning",
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

      // Step 4: Offer Engine
      offerEngine: {
        shopifyDiscountCodes: [],
        primaryDiscountCode: "SAVE10",
        primaryDiscountValue: "10% off",
        offerShippingDiscount: true,
        shippingDiscountText: "Free shipping on orders over $50",
        offerPaymentPlans: true,
        returnPolicy: "30 days return",
      },

      // Step 5: Agent Persona
      agentPersona: {
        agentName: "Sarah",
        language: "English (US)",
        voiceStyle: "sarah-professional-female",
        greetingStyle: "standard",
        customGreeting: "",
      },

      // Step 6: Objection Handling
      objectionHandling: {
        shipping: true,
        price: true,
        size: true,
        payment: true,
        technical: true,
        comparison: true,
        forgot: true,
        shippingResponse:
          "We offer fast and reliable shipping with tracking. Most orders arrive within 3-5 business days.",
        priceResponse:
          "We have competitive pricing and often run special promotions. Plus, we offer price matching on select items.",
        sizeResponse:
          "We offer a wide range of sizes and easy returns if needed. You can exchange for a different size at no cost.",
        paymentResponse:
          "We accept all major credit cards and offer secure checkout. Your payment information is always protected.",
        technicalResponse:
          "Our customer support team is here to help with any issues. You can reach us at support@yourstore.com.",
        comparisonResponse:
          "We're confident you'll find our quality and service exceptional. We stand behind all our products.",
        forgotResponse:
          "No problem! I can help you complete your purchase quickly. Your cart is still saved and ready to go.",
      },

      // Step 7: Launch & Test
      launchTest: {
        testCallsCompleted: 0,
        validationStatus: "pending",
        deploymentStatus: "draft",
        testResults: [],
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
        businessHours: "Mon-Fri, 9am-6pm EST",
        supportChannels: "Email, Phone, Chat",
        storeDescription:
          "We offer high-quality products with excellent customer service and fast shipping.",
        storeCategory: "general",
        fulfillmentMethod: "shipping",
      },

      // Step 2: Commerce Settings
      commerceSettings: {
        expressProviders: ["shop-pay", "paypal", "google-pay", "apple-pay"],
        paymentsAccepted: "Visa, Mastercard, American Express, Discover",
        bnplProviders: "Klarna, Afterpay, Affirm",
        guestCheckoutEnabled: true,
        discountsNotes: "Student discounts available with valid ID",
        discountTypes: ["military", "student", "first-responder", "newsletter"],
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
          waitTime: "1",
          waitTimeUnit: "hours",
          maxRetries: "2",
          retryInterval: "12",
          retryIntervalUnit: "hours",
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
        shopifyDiscountCodes: [],
        primaryDiscountCode: "LOYALTY15",
        primaryDiscountValue: "15% off",
        offerShippingDiscount: false,
        shippingDiscountText: "",
        offerPaymentPlans: false,
        returnPolicy: "30 days return",
      },

      // Step 5: Agent Persona
      agentPersona: {
        agentName: "Mike",
        language: "English (US)",
        voiceStyle: "mike-friendly-male",
        greetingStyle: "casual",
        customGreeting: "",
      },

      // Step 6: Objection Handling
      objectionHandling: {
        shipping: true,
        price: true,
        size: true,
        payment: true,
        technical: true,
        comparison: false,
        forgot: false,
        shippingResponse:
          "We offer fast and reliable shipping with tracking. Most orders arrive within 3-5 business days.",
        priceResponse:
          "We have competitive pricing and often run special promotions. Plus, we offer price matching on select items.",
        sizeResponse:
          "We offer a wide range of sizes and easy returns if needed. You can exchange for a different size at no cost.",
        paymentResponse:
          "We accept all major credit cards and offer secure checkout. Your payment information is always protected.",
        technicalResponse:
          "Our customer support team is here to help with any issues. You can reach us at support@yourstore.com.",
        comparisonResponse: "",
        forgotResponse: "",
      },

      // Step 7: Launch & Test
      launchTest: {
        testCallsCompleted: 0,
        validationStatus: "pending",
        deploymentStatus: "draft",
        testResults: [],
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
        businessHours: "Mon-Fri, 9am-6pm EST",
        supportChannels: "Email, Phone, Chat, Concierge",
        storeDescription:
          "We offer premium products with white-glove service and exclusive benefits for our valued customers.",
        storeCategory: "premium",
        fulfillmentMethod: "shipping",
      },

      // Step 2: Commerce Settings
      commerceSettings: {
        expressProviders: [
          "shop-pay",
          "paypal",
          "google-pay",
          "apple-pay",
          "amazon-pay",
        ],
        paymentsAccepted:
          "Visa, Mastercard, American Express, Discover, Wire Transfer",
        bnplProviders: "Klarna, Afterpay, Affirm, Splitit",
        guestCheckoutEnabled: false,
        discountsNotes: "VIP customer discounts and exclusive offers available",
        discountTypes: ["vip", "loyalty", "referral", "newsletter"],
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
            value: "premium",
            enabled: true,
          },
        ],
        callSchedule: {
          waitTime: "1",
          waitTimeUnit: "hours",
          maxRetries: "5",
          retryInterval: "12",
          retryIntervalUnit: "hours",
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
        shopifyDiscountCodes: [],
        primaryDiscountCode: "VIP20",
        primaryDiscountValue: "20% off",
        offerShippingDiscount: true,
        shippingDiscountText: "Free express shipping and handling",
        offerPaymentPlans: true,
        returnPolicy: "60 days return with free shipping",
      },

      // Step 5: Agent Persona
      agentPersona: {
        agentName: "Emma",
        language: "English (US)",
        voiceStyle: "emma-warm-female",
        greetingStyle: "custom",
        customGreeting:
          "Hello [Name], this is Emma from [Store]. I noticed you have some premium items in your cart and I wanted to personally assist you with completing your purchase. As a valued customer, I'm here to ensure you have an exceptional experience.",
      },

      // Step 6: Objection Handling
      objectionHandling: {
        shipping: true,
        price: true,
        size: true,
        payment: true,
        technical: true,
        comparison: true,
        forgot: true,
        shippingResponse:
          "We offer premium shipping with full tracking and insurance. Most orders arrive within 1-2 business days with our express service.",
        priceResponse:
          "Our premium products offer exceptional value and quality. Plus, as a VIP customer, you have access to exclusive pricing and special offers.",
        sizeResponse:
          "We offer comprehensive sizing guides and free exchanges. Our premium service includes personal fitting consultations if needed.",
        paymentResponse:
          "We accept all major credit cards and offer secure checkout. Premium customers also have access to special financing options.",
        technicalResponse:
          "Our premium support team is available 24/7 to assist you. You'll have a dedicated account manager for personalized service.",
        comparisonResponse:
          "Our premium products are crafted with the finest materials and backed by our exceptional service guarantee. We're confident you'll find our quality unmatched.",
        forgotResponse:
          "No worries at all! I'm here to personally assist you with completing your premium purchase. Your cart is saved and ready to go.",
      },

      // Step 7: Launch & Test
      launchTest: {
        testCallsCompleted: 0,
        validationStatus: "pending",
        deploymentStatus: "draft",
        testResults: [],
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
