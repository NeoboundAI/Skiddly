"use client";

import React, { useState, useEffect } from "react";
import {
  FiChevronRight,
  FiChevronLeft,
  FiShoppingBag,
  FiCreditCard,
  FiPhone,
  FiGift,
  FiUser,
  FiMessageSquare,
  FiPlay,
  FiCheckCircle,
} from "react-icons/fi";
import axios from "axios";
import StoreProfileStep from "./AgentWizardSteps/StoreProfileStep";
import CommerceSettingsStep from "./AgentWizardSteps/CommerceSettingsStep";
import CallLogicStep from "./AgentWizardSteps/CallLogicStep";
import OfferEngineStep from "./AgentWizardSteps/OfferEngineStep";
import AgentPersonaStep from "./AgentWizardSteps/AgentPersonaStep";
import ObjectionHandlingStep from "./AgentWizardSteps/ObjectionHandlingStep";
import LaunchTestStep from "./AgentWizardSteps/LaunchTestStep";
import { useRouter } from "next/navigation";
import { BackIcon } from "./ui/icons/icons";
import toast from "react-hot-toast";
import { useTwilio } from "@/hooks/useTwilio";
import {
  validateStep,
  getStepErrors,
  getStepMessages,
  validateAllSteps,
} from "@/utils/validation";

const AgentWizard = ({ agent, selectedShop, onSave, agentId }) => {
  const router = useRouter();
  const { numbers } = useTwilio();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savingStep, setSavingStep] = useState(false);
  const [stepValidation, setStepValidation] = useState({});
  const [stepRefs, setStepRefs] = useState({});
  const [validationAttempted, setValidationAttempted] = useState({});
  const [shopInfo, setShopInfo] = useState(null);
  const [fetchingShopInfo, setFetchingShopInfo] = useState(false);
  const [isMakingLive, setIsMakingLive] = useState(false);
  const [agentConfig, setAgentConfig] = useState({
    // Step 1: Store Profile
    storeProfile: {
      storeName: agent?.storeProfile?.storeName,
      storeUrl: agent?.storeProfile?.storeUrl,
      tagline: agent?.storeProfile?.tagline || "",
      supportEmail: agent?.storeProfile?.supportEmail || "",
      phoneNumber: agent?.storeProfile?.phoneNumber || "",
      businessAddress: agent?.storeProfile?.businessAddress || "",
      businessHours: agent?.storeProfile?.businessHours || {
        monday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
        tuesday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
        wednesday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
        thursday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
        friday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
        saturday: { isOpen: false, startTime: "09:00", endTime: "18:00" },
        sunday: { isOpen: false, startTime: "09:00", endTime: "18:00" },
      },
      supportChannels: agent?.storeProfile?.supportChannels || [
        "Email",
        "Phone",
        "Chat",
      ],
      storeDescription: agent?.storeProfile?.storeDescription || "",
      storeCategory: agent?.storeProfile?.storeCategory || "",
      fulfillmentMethod: agent?.storeProfile?.fulfillmentMethod || ["shipping"],
    },

    // Step 2: Commerce Settings
    commerceSettings: {
      checkoutProviders: {
        options: agent?.commerceSettings?.checkoutProviders?.options || [
          "Shop Pay",
          "PayPal",
          "Google Pay",
          "Apple Pay",
          "Amazon Pay",
          "Meta Pay",
          "Venmo",
          "Klarna",
        ],
        selected: agent?.commerceSettings?.checkoutProviders?.selected || [],
      },
      cardsAccepted: {
        options: agent?.commerceSettings?.cardsAccepted?.options || [
          "Visa",
          "Mastercard",
          "American Express",
          "Discover",
          "JCB",
          "Diners Club",
        ],
        selected: agent?.commerceSettings?.cardsAccepted?.selected || [],
      },
      buyNowPayLater: {
        options: agent?.commerceSettings?.buyNowPayLater?.options || [
          "Klarna",
          "Afterpay",
          "Affirm",
          "Sezzle",
          "Splitit",
        ],
        selected: agent?.commerceSettings?.buyNowPayLater?.selected || [],
      },
      discountCategories: {
        options: agent?.commerceSettings?.discountCategories?.options || [
          "Military",
          "Student",
          "First Responder",
          "Newsletter",
          "Referral",
          "Senior",
          "Teacher",
        ],
        selected: agent?.commerceSettings?.discountCategories?.selected || [],
      },
      shippingMethods: {
        options: agent?.commerceSettings?.shippingMethods?.options || [
          "USPS",
          "UPS",
          "FedEx",
          "DHL",
          "Local Delivery",
          "Same Day Delivery",
        ],
        selected: agent?.commerceSettings?.shippingMethods?.selected || [],
      },
      guestCheckoutEnabled:
        agent?.commerceSettings?.guestCheckoutEnabled ?? true,
      additionalNotes: agent?.commerceSettings?.additionalNotes || "",
    },

    // Step 3: Call Logic
    callLogic: {
      conditions: agent?.callLogic?.conditions || [
        {
          type: "cart-value",
          operator: ">=",
          value: "50",
          enabled: true,
        },
      ],
      callSchedule: {
        waitTime: agent?.callLogic?.callSchedule?.waitTime || "30",
        waitTimeUnit: agent?.callLogic?.callSchedule?.waitTimeUnit || "minutes",
        maxRetries: agent?.callLogic?.callSchedule?.maxRetries || 3,
        retryIntervals: agent?.callLogic?.callSchedule?.retryIntervals || [],
        weekendCalling: agent?.callLogic?.callSchedule?.weekendCalling ?? false,
        callTimeStart: agent?.callLogic?.callSchedule?.callTimeStart || "09:00",
        callTimeEnd: agent?.callLogic?.callSchedule?.callTimeEnd || "18:00",
        timezone: agent?.callLogic?.callSchedule?.timezone || "",
        respectDND: agent?.callLogic?.callSchedule?.respectDND ?? true,
        voicemailDetection:
          agent?.callLogic?.callSchedule?.voicemailDetection ?? true,
      },
    },

    // Step 4: Offer Engine
    offerEngine: {
      availableDiscounts: {
        enabled: agent?.offerEngine?.availableDiscounts?.enabled ?? false,
        selectedCodes:
          agent?.offerEngine?.availableDiscounts?.selectedCodes || [],
        allCodes: agent?.offerEngine?.availableDiscounts?.allCodes || [],
      },
      availableOffers: {
        shippingDiscount: {
          enabled:
            agent?.offerEngine?.availableOffers?.shippingDiscount?.enabled ??
            false,
          description: "Offer free discounted shipping",
          customText:
            agent?.offerEngine?.availableOffers?.shippingDiscount?.customText ||
            "",
        },
        paymentPlans: {
          enabled:
            agent?.offerEngine?.availableOffers?.paymentPlans?.enabled ?? false,
          description: "Offer payment plans - for high value carts",
          customText:
            agent?.offerEngine?.availableOffers?.paymentPlans?.customText || "",
        },
      },
      returnPolicy: {
        enabled: agent?.offerEngine?.returnPolicy?.enabled ?? false,
        days: agent?.offerEngine?.returnPolicy?.days || 30,
        description:
          agent?.offerEngine?.returnPolicy?.description || "30 days return",
      },
    },

    // Step 5: Agent Persona
    agentPersona: {
      agentName: agent?.agentPersona?.agentName || "Sarah",
      language: agent?.agentPersona?.language || "English (US)",
      voiceProvider: agent?.agentPersona?.voiceProvider || "11labs",
      voiceName: agent?.agentPersona?.voiceName || "",
      greetingStyle: agent?.agentPersona?.greetingStyle || {
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
          template:
            "Hi [Name], this is [Agent] from [Store]. I noticed you picked out [Product] but didn't get to checkout yet.",
        },
      },
    },

    // Step 6: Objection Handling
    objectionHandling: {
      "Shipping Cost Concern": {
        enabled:
          agent?.objectionHandling?.["Shipping Cost Concern"]?.enabled ?? true,
        defaultEnabled:
          agent?.objectionHandling?.["Shipping Cost Concern"]?.defaultEnabled ??
          true,
        customEnabled:
          agent?.objectionHandling?.["Shipping Cost Concern"]?.customEnabled ??
          false,
        title: "Shipping Cost Concerns",
        subtitle: "When customer complaints about shipping cost.",
        default:
          agent?.objectionHandling?.["Shipping Cost Concern"]?.default || "",
        custom:
          agent?.objectionHandling?.["Shipping Cost Concern"]?.custom || "",
      },
      "Price Concern": {
        enabled: agent?.objectionHandling?.["Price Concern"]?.enabled ?? true,
        defaultEnabled:
          agent?.objectionHandling?.["Price Concern"]?.defaultEnabled ?? true,
        customEnabled:
          agent?.objectionHandling?.["Price Concern"]?.customEnabled ?? false,
        title: "Price of objections",
        subtitle: "When customer complaints about price.",
        default: agent?.objectionHandling?.["Price Concern"]?.default || "",
        custom: agent?.objectionHandling?.["Price Concern"]?.custom || "",
      },
      "Payment Issue": {
        enabled: agent?.objectionHandling?.["Payment Issue"]?.enabled ?? true,
        defaultEnabled:
          agent?.objectionHandling?.["Payment Issue"]?.defaultEnabled ?? true,
        customEnabled:
          agent?.objectionHandling?.["Payment Issue"]?.customEnabled ?? false,
        title: "Payment concerns",
        subtitle: "When customer complaints about payment methods.",
        default: agent?.objectionHandling?.["Payment Issue"]?.default || "",
        custom: agent?.objectionHandling?.["Payment Issue"]?.custom || "",
      },
      "Technical Issues": {
        enabled:
          agent?.objectionHandling?.["Technical Issues"]?.enabled ?? true,
        defaultEnabled:
          agent?.objectionHandling?.["Technical Issues"]?.defaultEnabled ??
          true,
        customEnabled:
          agent?.objectionHandling?.["Technical Issues"]?.customEnabled ??
          false,
        title: "Technical issues",
        subtitle: "When customer complaints about technical problems.",
        default: agent?.objectionHandling?.["Technical Issues"]?.default || "",
        custom: agent?.objectionHandling?.["Technical Issues"]?.custom || "",
      },
      "Size/Fit Doubts (for fashion/apparel)": {
        enabled:
          agent?.objectionHandling?.["Size/Fit Doubts (for fashion/apparel)"]
            ?.enabled ?? true,
        defaultEnabled:
          agent?.objectionHandling?.["Size/Fit Doubts (for fashion/apparel)"]
            ?.defaultEnabled ?? true,
        customEnabled:
          agent?.objectionHandling?.["Size/Fit Doubts (for fashion/apparel)"]
            ?.customEnabled ?? false,
        title: "Size/Fit Concerns",
        subtitle: "When customer complaints about size or fit.",
        default:
          agent?.objectionHandling?.["Size/Fit Doubts (for fashion/apparel)"]
            ?.default || "",
        custom:
          agent?.objectionHandling?.["Size/Fit Doubts (for fashion/apparel)"]
            ?.custom || "",
      },
      "Comparison Shopping": {
        enabled:
          agent?.objectionHandling?.["Comparison Shopping"]?.enabled ?? true,
        defaultEnabled:
          agent?.objectionHandling?.["Comparison Shopping"]?.defaultEnabled ??
          true,
        customEnabled:
          agent?.objectionHandling?.["Comparison Shopping"]?.customEnabled ??
          false,
        title: "Comparison Shopping",
        subtitle: "When customer is comparing with other stores.",
        default:
          agent?.objectionHandling?.["Comparison Shopping"]?.default || "",
        custom: agent?.objectionHandling?.["Comparison Shopping"]?.custom || "",
      },
      "Just Forgot / Got Busy": {
        enabled:
          agent?.objectionHandling?.["Just Forgot / Got Busy"]?.enabled ?? true,
        defaultEnabled:
          agent?.objectionHandling?.["Just Forgot / Got Busy"]
            ?.defaultEnabled ?? true,
        customEnabled:
          agent?.objectionHandling?.["Just Forgot / Got Busy"]?.customEnabled ??
          false,
        title: "Forgot to Complete",
        subtitle: "When customer forgot to complete purchase.",
        default:
          agent?.objectionHandling?.["Just Forgot / Got Busy"]?.default || "",
        custom:
          agent?.objectionHandling?.["Just Forgot / Got Busy"]?.custom || "",
      },
      "Product Questions/Uncertainty": {
        enabled:
          agent?.objectionHandling?.["Product Questions/Uncertainty"]
            ?.enabled ?? true,
        defaultEnabled:
          agent?.objectionHandling?.["Product Questions/Uncertainty"]
            ?.defaultEnabled ?? true,
        customEnabled:
          agent?.objectionHandling?.["Product Questions/Uncertainty"]
            ?.customEnabled ?? false,
        title: "Product Questions/Uncertainty",
        subtitle: "When customer has questions about products.",
        default:
          agent?.objectionHandling?.["Product Questions/Uncertainty"]
            ?.default || "",
        custom:
          agent?.objectionHandling?.["Product Questions/Uncertainty"]?.custom ||
          "",
      },
      "Wrong Item/Changed Mind": {
        enabled:
          agent?.objectionHandling?.["Wrong Item/Changed Mind"]?.enabled ??
          true,
        defaultEnabled:
          agent?.objectionHandling?.["Wrong Item/Changed Mind"]
            ?.defaultEnabled ?? true,
        customEnabled:
          agent?.objectionHandling?.["Wrong Item/Changed Mind"]
            ?.customEnabled ?? false,
        title: "Wrong Item/Changed Mind",
        subtitle: "When customer wants to change or remove items.",
        default:
          agent?.objectionHandling?.["Wrong Item/Changed Mind"]?.default || "",
        custom:
          agent?.objectionHandling?.["Wrong Item/Changed Mind"]?.custom || "",
      },
    },

    // Step 7: Launch & Test
    testLaunch: {
      isLive: agent?.testLaunch?.isLive ?? false,
      connectedPhoneNumbers: agent?.testLaunch?.connectedPhoneNumbers || [],
      connectedKnowledgeBase: {
        enabled: agent?.testLaunch?.connectedKnowledgeBase?.enabled ?? false,
        selectedBases:
          agent?.testLaunch?.connectedKnowledgeBase?.selectedBases || [],
      },
      policyLinks: {
        refundPolicy: agent?.testLaunch?.policyLinks?.refundPolicy || "",
        cancellationPolicy:
          agent?.testLaunch?.policyLinks?.cancellationPolicy || "",
        shippingPolicy: agent?.testLaunch?.policyLinks?.shippingPolicy || "",
        termsAndConditions:
          agent?.testLaunch?.policyLinks?.termsAndConditions || "",
        warranty: agent?.testLaunch?.policyLinks?.warranty || "",
      },
    },
  });

  // Update agentConfig when agent prop changes
  useEffect(() => {
    if (agent) {
      setAgentConfig({
        // Step 1: Store Profile
        storeProfile: {
          storeName: agent.storeProfile?.storeName,
          storeUrl: agent.storeProfile?.storeUrl,
          tagline: agent.storeProfile?.tagline || "",
          supportEmail: agent.storeProfile?.supportEmail || "",
          phoneNumber: agent.storeProfile?.phoneNumber || "",
          businessAddress: agent.storeProfile?.businessAddress || "",
          businessHours: agent.storeProfile?.businessHours || {
            monday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
            tuesday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
            wednesday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
            thursday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
            friday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
            saturday: { isOpen: false, startTime: "09:00", endTime: "18:00" },
            sunday: { isOpen: false, startTime: "09:00", endTime: "18:00" },
          },
          supportChannels: agent.storeProfile?.supportChannels || [
            "Email",
            "Phone",
            "Chat",
          ],
          storeDescription: agent.storeProfile?.storeDescription || "",
          storeCategory: agent.storeProfile?.storeCategory || "",
          fulfillmentMethod: agent.storeProfile?.fulfillmentMethod || [
            "shipping",
          ],
        },

        // Step 2: Commerce Settings
        commerceSettings: {
          checkoutProviders: {
            options: agent.commerceSettings?.checkoutProviders?.options || [
              "Shop Pay",
              "PayPal",
              "Google Pay",
              "Apple Pay",
              "Amazon Pay",
              "Meta Pay",
              "Venmo",
              "Klarna",
            ],
            selected: agent.commerceSettings?.checkoutProviders?.selected || [],
          },
          cardsAccepted: {
            options: agent.commerceSettings?.cardsAccepted?.options || [
              "Visa",
              "Mastercard",
              "American Express",
              "Discover",
              "JCB",
              "Diners Club",
            ],
            selected: agent.commerceSettings?.cardsAccepted?.selected || [],
          },
          buyNowPayLater: {
            options: agent.commerceSettings?.buyNowPayLater?.options || [
              "Klarna",
              "Afterpay",
              "Affirm",
              "Sezzle",
              "Splitit",
            ],
            selected: agent.commerceSettings?.buyNowPayLater?.selected || [],
          },
          discountCategories: {
            options: agent.commerceSettings?.discountCategories?.options || [
              "Military",
              "Student",
              "First Responder",
              "Newsletter",
              "Referral",
              "Senior",
              "Teacher",
            ],
            selected:
              agent.commerceSettings?.discountCategories?.selected || [],
          },
          shippingMethods: {
            options: agent.commerceSettings?.shippingMethods?.options || [
              "USPS",
              "UPS",
              "FedEx",
              "DHL",
              "Local Delivery",
              "Same Day Delivery",
            ],
            selected: agent.commerceSettings?.shippingMethods?.selected || [],
          },
          guestCheckoutEnabled:
            agent.commerceSettings?.guestCheckoutEnabled ?? true,
          additionalNotes: agent.commerceSettings?.additionalNotes || "",
        },

        // Step 3: Call Logic
        callLogic: {
          conditions: agent.callLogic?.conditions || [
            {
              type: "cart-value",
              operator: ">=",
              value: "50",
              enabled: true,
            },
          ],
          callSchedule: {
            waitTime: agent.callLogic?.callSchedule?.waitTime || "30",
            waitTimeUnit:
              agent.callLogic?.callSchedule?.waitTimeUnit || "minutes",
            maxRetries: agent.callLogic?.callSchedule?.maxRetries || 3,
            retryIntervals: agent.callLogic?.callSchedule?.retryIntervals || [
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
            weekendCalling:
              agent.callLogic?.callSchedule?.weekendCalling ?? false,
            callTimeStart:
              agent.callLogic?.callSchedule?.callTimeStart || "09:00",
            callTimeEnd: agent.callLogic?.callSchedule?.callTimeEnd || "18:00",
            timezone: agent.callLogic?.callSchedule?.timezone || "",
            respectDND: agent.callLogic?.callSchedule?.respectDND ?? true,
            voicemailDetection:
              agent.callLogic?.callSchedule?.voicemailDetection ?? true,
          },
        },

        // Step 4: Offer Engine
        offerEngine: {
          availableDiscounts: {
            enabled: agent.offerEngine?.availableDiscounts?.enabled ?? false,
            selectedCodes:
              agent.offerEngine?.availableDiscounts?.selectedCodes || [],
            allCodes: agent.offerEngine?.availableDiscounts?.allCodes || [],
          },
          availableOffers: {
            shippingDiscount: {
              enabled:
                agent.offerEngine?.availableOffers?.shippingDiscount?.enabled ??
                false,
              description: "Offer free discounted shipping",
              customText:
                agent.offerEngine?.availableOffers?.shippingDiscount
                  ?.customText || "",
            },
            paymentPlans: {
              enabled:
                agent.offerEngine?.availableOffers?.paymentPlans?.enabled ??
                false,
              description: "Offer payment plans - for high value carts",
              customText:
                agent.offerEngine?.availableOffers?.paymentPlans?.customText ||
                "",
            },
          },
          returnPolicy: {
            enabled: agent.offerEngine?.returnPolicy?.enabled ?? false,
            days: agent.offerEngine?.returnPolicy?.days || 30,
            description:
              agent.offerEngine?.returnPolicy?.description || "30 days return",
          },
        },

        // Step 5: Agent Persona
        agentPersona: {
          agentName: agent.agentPersona?.agentName || "Sarah",
          language: agent.agentPersona?.language || "English (US)",
          voiceProvider: agent.agentPersona?.voiceProvider || "11labs",
          voiceName:
            agent.agentPersona?.voiceName || "sarah-professional-female",
          greetingStyle: agent.agentPersona?.greetingStyle || {
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
              template:
                "Hi [Name], this is [Agent] from [Store]. I noticed you picked out [Product] but didn't get to checkout yet.",
            },
          },
        },

        // Step 6: Objection Handling
        objectionHandling: {
          "Shipping Cost Concern": {
            enabled:
              agent?.objectionHandling?.["Shipping Cost Concern"]?.enabled ??
              true,
            defaultEnabled:
              agent?.objectionHandling?.["Shipping Cost Concern"]
                ?.defaultEnabled ?? true,
            customEnabled:
              agent?.objectionHandling?.["Shipping Cost Concern"]
                ?.customEnabled ?? false,
            title: "Shipping Cost Concerns",
            subtitle: "When customer complaints about shipping cost.",
            default:
              agent?.objectionHandling?.["Shipping Cost Concern"]?.default ||
              "I completely understand — actually, we sometimes offer free or discounted shipping. Would it help if I sent you today's best shipping offer?",
            custom:
              agent?.objectionHandling?.["Shipping Cost Concern"]?.custom || "",
          },
          "Price Concern": {
            enabled:
              agent?.objectionHandling?.["Price Concern"]?.enabled ?? true,
            defaultEnabled:
              agent?.objectionHandling?.["Price Concern"]?.defaultEnabled ??
              true,
            customEnabled:
              agent?.objectionHandling?.["Price Concern"]?.customEnabled ??
              false,
            title: "Price of objections",
            subtitle: "When customer complaints about price.",
            default:
              agent?.objectionHandling?.["Price Concern"]?.default ||
              "I hear you — pricing matters. I can check if there's any ongoing discount, or I can share a quick offer code you could use today: {{DiscountCode}}.",
            custom: agent?.objectionHandling?.["Price Concern"]?.custom || "",
          },
          "Payment Issue": {
            enabled:
              agent?.objectionHandling?.["Payment Issue"]?.enabled ?? true,
            defaultEnabled:
              agent?.objectionHandling?.["Payment Issue"]?.defaultEnabled ??
              true,
            customEnabled:
              agent?.objectionHandling?.["Payment Issue"]?.customEnabled ??
              false,
            title: "Payment concerns",
            subtitle: "When customer complaints about payment methods.",
            default:
              agent?.objectionHandling?.["Payment Issue"]?.default ||
              "Ah, that's frustrating. I can send you a quick payment link now on WhatsApp or SMS — it should only take a minute to complete your order.",
            custom: agent?.objectionHandling?.["Payment Issue"]?.custom || "",
          },
          "Technical Issues": {
            enabled:
              agent?.objectionHandling?.["Technical Issues"]?.enabled ?? true,
            defaultEnabled:
              agent?.objectionHandling?.["Technical Issues"]?.defaultEnabled ??
              true,
            customEnabled:
              agent?.objectionHandling?.["Technical Issues"]?.customEnabled ??
              false,
            title: "Technical issues",
            subtitle: "When customer complaints about technical problems.",
            default:
              agent?.objectionHandling?.["Technical Issues"]?.default ||
              "I'm sorry you experienced that. Let me send you a direct checkout link that should work smoothly, or I can help you complete the order over the phone right now.",
            custom:
              agent?.objectionHandling?.["Technical Issues"]?.custom || "",
          },
          "Size/Fit Doubts (for fashion/apparel)": {
            enabled:
              agent?.objectionHandling?.[
                "Size/Fit Doubts (for fashion/apparel)"
              ]?.enabled ?? true,
            defaultEnabled:
              agent?.objectionHandling?.[
                "Size/Fit Doubts (for fashion/apparel)"
              ]?.defaultEnabled ?? true,
            customEnabled:
              agent?.objectionHandling?.[
                "Size/Fit Doubts (for fashion/apparel)"
              ]?.customEnabled ?? false,
            title: "Size/Fit Concerns",
            subtitle: "When customer complaints about size or fit.",
            default:
              agent?.objectionHandling?.[
                "Size/Fit Doubts (for fashion/apparel)"
              ]?.default ||
              "Totally get it — fit is important. We have a quick size chart and easy exchange policy. Want me to text it to you?",
            custom:
              agent?.objectionHandling?.[
                "Size/Fit Doubts (for fashion/apparel)"
              ]?.custom || "",
          },
          "Comparison Shopping": {
            enabled:
              agent?.objectionHandling?.["Comparison Shopping"]?.enabled ??
              true,
            defaultEnabled:
              agent?.objectionHandling?.["Comparison Shopping"]
                ?.defaultEnabled ?? true,
            customEnabled:
              agent?.objectionHandling?.["Comparison Shopping"]
                ?.customEnabled ?? false,
            title: "Comparison Shopping",
            subtitle: "When customer is comparing with other stores.",
            default:
              agent?.objectionHandling?.["Comparison Shopping"]?.default ||
              "I understand you want to make sure you're getting the best deal. What I can offer you right now is {{DiscountCode}} which gives you [discount details], plus our quality guarantee.",
            custom:
              agent?.objectionHandling?.["Comparison Shopping"]?.custom || "",
          },
          "Just Forgot / Got Busy": {
            enabled:
              agent?.objectionHandling?.["Just Forgot / Got Busy"]?.enabled ??
              true,
            defaultEnabled:
              agent?.objectionHandling?.["Just Forgot / Got Busy"]
                ?.defaultEnabled ?? true,
            customEnabled:
              agent?.objectionHandling?.["Just Forgot / Got Busy"]
                ?.customEnabled ?? false,
            title: "Forgot to Complete",
            subtitle: "When customer forgot to complete purchase.",
            default:
              agent?.objectionHandling?.["Just Forgot / Got Busy"]?.default ||
              "No problem at all — I can send you the checkout link so you can finish whenever you're ready.",
            custom:
              agent?.objectionHandling?.["Just Forgot / Got Busy"]?.custom ||
              "",
          },
          "Product Questions/Uncertainty": {
            enabled:
              agent?.objectionHandling?.["Product Questions/Uncertainty"]
                ?.enabled ?? true,
            defaultEnabled:
              agent?.objectionHandling?.["Product Questions/Uncertainty"]
                ?.defaultEnabled ?? true,
            customEnabled:
              agent?.objectionHandling?.["Product Questions/Uncertainty"]
                ?.customEnabled ?? false,
            title: "Product Questions/Uncertainty",
            subtitle: "When customer has questions about products.",
            default:
              agent?.objectionHandling?.["Product Questions/Uncertainty"]
                ?.default ||
              "Great question about {{ProductNames}}. Let me share some quick details that might help: [provide relevant info]. Also, we have a great return policy if you're not completely satisfied.",
            custom:
              agent?.objectionHandling?.["Product Questions/Uncertainty"]
                ?.custom || "",
          },
          "Wrong Item/Changed Mind": {
            enabled:
              agent?.objectionHandling?.["Wrong Item/Changed Mind"]?.enabled ??
              true,
            defaultEnabled:
              agent?.objectionHandling?.["Wrong Item/Changed Mind"]
                ?.defaultEnabled ?? true,
            customEnabled:
              agent?.objectionHandling?.["Wrong Item/Changed Mind"]
                ?.customEnabled ?? false,
            title: "Wrong Item/Changed Mind",
            subtitle: "When customer wants to change or remove items.",
            default:
              agent?.objectionHandling?.["Wrong Item/Changed Mind"]?.default ||
              "No worries at all. Would you like me to help you find something else from our collection that might be a better fit? Or shall I remove these items from your cart?",
            custom:
              agent?.objectionHandling?.["Wrong Item/Changed Mind"]?.custom ||
              "",
          },
        },

        // Step 7: Launch & Test
        testLaunch: {
          isLive: agent?.testLaunch?.isLive ?? false,
          connectedPhoneNumbers: agent?.testLaunch?.connectedPhoneNumbers || [],
          connectedKnowledgeBase: {
            enabled:
              agent?.testLaunch?.connectedKnowledgeBase?.enabled ?? false,
            selectedBases:
              agent?.testLaunch?.connectedKnowledgeBase?.selectedBases || [],
          },
          policyLinks: {
            refundPolicy: agent?.testLaunch?.policyLinks?.refundPolicy || "",
            cancellationPolicy:
              agent?.testLaunch?.policyLinks?.cancellationPolicy || "",
            shippingPolicy:
              agent?.testLaunch?.policyLinks?.shippingPolicy || "",
            termsAndConditions:
              agent?.testLaunch?.policyLinks?.termsAndConditions || "",
            warranty: agent?.testLaunch?.policyLinks?.warranty || "",
          },
        },
      });
    }
  }, [agent, selectedShop]);

  // Fetch shop info every time selectedShop changes
  useEffect(() => {
    if (selectedShop?._id) {
      fetchShopInfo();
    }
  }, [selectedShop]);

  const steps = [
    { id: 1, name: "Store Profile", icon: FiShoppingBag },
    { id: 2, name: "Commerce Settings", icon: FiCreditCard },
    { id: 3, name: "Call Logic", icon: FiPhone },
    { id: 4, name: "Offer Engine", icon: FiGift },
    { id: 5, name: "Agent Persona", icon: FiUser },
    { id: 6, name: "Objection Handling", icon: FiMessageSquare },
    { id: 7, name: "Test & Launch", icon: FiPlay },
  ];

  const updateConfig = (section, data) => {
    setAgentConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }));
  };

  const updateVapiConfig = (vapiData) => {
    setAgentConfig((prev) => ({
      ...prev,
      vapiConfiguration: { ...prev.vapiConfiguration, ...vapiData },
    }));
  };

  const fetchShopInfo = async () => {
    if (!selectedShop?._id) return;

    try {
      setFetchingShopInfo(true);
      const response = await axios.get(
        `/api/shopify/shop-info?shopId=${selectedShop._id}`
      );

      if (response.data.success) {
        const fetchedShopInfo = response.data.data;
        console.log("Fetched shop info:", fetchedShopInfo);

        // Always store shop info for other steps to use
        setShopInfo(fetchedShopInfo);

        // Only update store profile if storeUrl is empty
        if (!agentConfig.storeProfile?.storeUrl) {
          updateConfig("storeProfile", {
            storeName:
              fetchedShopInfo.name || agentConfig.storeProfile?.storeName,
            storeUrl: fetchedShopInfo.myshopify_domain || selectedShop.shop,
            tagline: agentConfig.storeProfile?.tagline, // Keep existing tagline
            supportEmail:
              fetchedShopInfo.customer_email ||
              agentConfig.storeProfile?.supportEmail,
            phoneNumber:
              fetchedShopInfo.phone || agentConfig.storeProfile?.phoneNumber,
            businessAddress: fetchedShopInfo.address1
              ? `${fetchedShopInfo.address1}${
                  fetchedShopInfo.address2
                    ? ", " + fetchedShopInfo.address2
                    : ""
                }${fetchedShopInfo.city ? ", " + fetchedShopInfo.city : ""}${
                  fetchedShopInfo.province
                    ? ", " + fetchedShopInfo.province
                    : ""
                }${fetchedShopInfo.zip ? " " + fetchedShopInfo.zip : ""}${
                  fetchedShopInfo.country_name
                    ? ", " + fetchedShopInfo.country_name
                    : ""
                }`
              : agentConfig.storeProfile?.businessAddress,
            storeDescription: agentConfig.storeProfile?.storeDescription, // Keep existing description
            storeCategory: agentConfig.storeProfile?.storeCategory, // Keep existing category
          });
        }
      } else {
        console.error("Failed to fetch shop info:", response.data.error);
        toast.error("Failed to fetch shop information");
      }
    } catch (error) {
      console.error("Error fetching shop info:", error);
      toast.error("Error fetching shop information");
    } finally {
      setFetchingShopInfo(false);
    }
  };

  const handleStepValidationChange = (stepId, isValid) => {
    setStepValidation((prev) => ({
      ...prev,
      [stepId]: isValid,
    }));
  };

  const getStepName = (stepNumber) => {
    const stepNames = {
      1: "storeProfile",
      2: "commerceSettings",
      3: "callLogic",
      4: "offerEngine",
      5: "agentPersona",
      6: "objectionHandling",
      7: "testLaunch",
    };
    return stepNames[stepNumber];
  };

  const getStepConfig = (stepNumber) => {
    const stepName = getStepName(stepNumber);
    return agentConfig[stepName];
  };

  const validateCurrentStep = () => {
    // Mark that validation has been attempted for this step
    setValidationAttempted((prev) => ({
      ...prev,
      [currentStep]: true,
    }));

    // Get step name and config
    const stepName = getStepName(currentStep);
    const config = getStepConfig(currentStep);

    // Validate the step using the centralized validation system
    const { isValid, errors } = validateStep(stepName, config);

    if (!isValid) {
      // Get step-specific messages
      const messages = getStepMessages(stepName);

      toast.error(messages.description);
      return false;
    }

    return true;
  };

  const handleNextStep = async () => {
    if (validateCurrentStep()) {
      // Save current step data before proceeding
      setSavingStep(true);
      await saveCurrentStep();
      setSavingStep(false);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    // Clear validation attempted state for the step we're going back to
    setValidationAttempted((prev) => ({
      ...prev,
      [currentStep - 1]: false,
    }));
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const saveCurrentStep = async () => {
    try {
      const stepData = getCurrentStepData();
      if (stepData) {
        await axios.put(`/api/agents/${agentId}/step`, {
          step: getCurrentStepName(),
          data: stepData,
        });
      }
    } catch (error) {
      console.error("Error saving step:", error);
      toast.error("Error saving step. Please try again.");
    }
  };

  const getCurrentStepName = () => {
    const stepNames = {
      1: "storeProfile",
      2: "commerceSettings",
      3: "callLogic",
      4: "offerEngine",
      5: "agentPersona",
      6: "objectionHandling",
      7: "testLaunch",
    };
    return stepNames[currentStep];
  };

  const getCurrentStepData = () => {
    const stepName = getCurrentStepName();
    return agentConfig[stepName];
  };

  const handleToggleStatus = async () => {
    try {
      setLoading(true);

      const newStatus = agent?.status === "active" ? "inactive" : "active";

      await axios.put(`/api/agents/${agentId}/status`, { status: newStatus });

      if (onSave) onSave(); // Refresh the agent data

      const statusMessage =
        newStatus === "active" ? "Agent is now live!" : "Agent is now inactive";
      toast.success(statusMessage);
    } catch (error) {
      console.error("Error updating agent status:", error);
      toast.error("Error updating agent status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Prepare the update data with the new 7-step structure
      const updateData = {
        // Step 1: Store Profile
        storeProfile: agentConfig.storeProfile,

        // Step 2: Commerce Settings
        commerceSettings: agentConfig.commerceSettings,

        // Step 3: Call Logic
        callLogic: agentConfig.callLogic,

        // Step 4: Offer Engine
        offerEngine: agentConfig.offerEngine,

        // Step 5: Agent Persona
        agentPersona: agentConfig.agentPersona,

        // Step 6: Objection Handling
        objectionHandling: agentConfig.objectionHandling,

        // Step 7: Launch & Test
        testLaunch: agentConfig.testLaunch,
      };

      // If agent is inactive, we need to make it live after saving
      if (agent?.status === "inactive") {
        // First save the configuration
        await axios.put(`/api/agents/${agentId}`, updateData);

        // Then make it live using the make-live endpoint
        const selectedPhoneNumberId =
          agentConfig.testLaunch?.connectedPhoneNumbers?.[0];
        const selectedPhoneNumber = numbers?.find(
          (n) => n._id === selectedPhoneNumberId
        );

        if (!selectedPhoneNumber) {
          toast.error(
            "Please select a phone number before making the agent live"
          );
          return;
        }

        const response = await axios.post(`/api/agents/${agentId}/make-live`, {
          selectedPhoneNumber: selectedPhoneNumber,
        });

        if (response.data.success) {
          toast.success("Agent saved and is now live! 🎉");
        } else {
          toast.error(response.data.message || "Failed to make agent live");
        }
      } else {
        // Just save the configuration for active agents
        await axios.put(`/api/agents/${agentId}`, updateData);
        toast.success("Agent saved successfully!");
      }

      if (onSave) onSave();
    } catch (error) {
      console.error("Error saving agent:", error);
      toast.error("Error saving agent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMakeLive = async () => {
    try {
      setIsMakingLive(true);

      // Validate all steps
      const { isValid, stepErrors } = validateAllSteps(agentConfig);

      if (!isValid) {
        // Find the first invalid step
        const invalidSteps = Object.keys(stepErrors);
        const firstInvalidStep = invalidSteps[0];
        const stepNumber = getStepNumberFromName(firstInvalidStep);

        toast.error(
          `Please complete step ${stepNumber} before making the agent live`
        );
        setCurrentStep(stepNumber);
        return;
      }

      // Validate phone number selection
      if (
        !agentConfig.testLaunch?.connectedPhoneNumbers ||
        agentConfig.testLaunch.connectedPhoneNumbers.length === 0
      ) {
        toast.error(
          "Please select a phone number before making the agent live"
        );
        return;
      }

      // Save current step data first (same as other steps)
      setSavingStep(true);
      await saveCurrentStep();
      setSavingStep(false);

      // Create VAPI assistant and make agent live
      // Find the selected phone number object from the numbers array
      const selectedPhoneNumberId =
        agentConfig.testLaunch.connectedPhoneNumbers[0];
      const selectedPhoneNumber = numbers.find(
        (n) => n._id === selectedPhoneNumberId
      );

      const response = await axios.post(`/api/agents/${agentId}/make-live`, {
        vapiConfiguration: agent.vapiConfiguration,
        selectedPhoneNumber: selectedPhoneNumber,
      });

      if (response.data.success) {
        toast.success("Agent is now live! 🎉");
        if (onSave) onSave(); // Refresh the agent data
      } else {
        toast.error(response.data.message || "Failed to make agent live");
      }
    } catch (error) {
      console.error("Error making agent live:", error);
      toast.error("Failed to make agent live. Please try again.");
    } finally {
      setIsMakingLive(false);
    }
  };

  const getStepNumberFromName = (stepName) => {
    const stepMap = {
      storeProfile: 1,
      commerceSettings: 2,
      callLogic: 3,
      offerEngine: 4,
      agentPersona: 5,
      objectionHandling: 6,
      testLaunch: 7,
    };
    return stepMap[stepName] || 1;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StoreProfileStep
            config={agentConfig.storeProfile}
            onUpdate={(data) => updateConfig("storeProfile", data)}
            selectedShop={selectedShop}
            shopInfo={shopInfo}
            fetchingShopInfo={fetchingShopInfo}
            onValidationChange={(isValid) =>
              handleStepValidationChange(1, isValid)
            }
            errors={
              validationAttempted[1]
                ? getStepErrors("storeProfile", agentConfig.storeProfile)
                : {}
            }
          />
        );
      case 2:
        return (
          <CommerceSettingsStep
            config={agentConfig.commerceSettings}
            onUpdate={(data) => updateConfig("commerceSettings", data)}
            selectedShop={selectedShop}
            shopInfo={shopInfo}
            errors={
              validationAttempted[2]
                ? getStepErrors(
                    "commerceSettings",
                    agentConfig.commerceSettings
                  )
                : {}
            }
          />
        );
      case 3:
        return (
          <CallLogicStep
            config={agentConfig.callLogic}
            onUpdate={(data) => updateConfig("callLogic", data)}
            selectedShop={selectedShop}
            shopInfo={shopInfo}
            commerceSettings={agentConfig.commerceSettings}
            errors={
              validationAttempted[3]
                ? getStepErrors("callLogic", agentConfig.callLogic)
                : {}
            }
          />
        );
      case 4:
        return (
          <OfferEngineStep
            config={agentConfig.offerEngine}
            onUpdate={(data) => updateConfig("offerEngine", data)}
            selectedShop={selectedShop}
            shopInfo={shopInfo}
            errors={
              validationAttempted[4]
                ? getStepErrors("offerEngine", agentConfig.offerEngine)
                : {}
            }
          />
        );
      case 5:
        return (
          <AgentPersonaStep
            config={agentConfig.agentPersona}
            onUpdate={(data) => updateConfig("agentPersona", data)}
            onVapiUpdate={(data) => updateVapiConfig(data)}
            selectedShop={selectedShop}
            shopInfo={shopInfo}
            errors={
              validationAttempted[5]
                ? getStepErrors("agentPersona", agentConfig.agentPersona)
                : {}
            }
          />
        );
      case 6:
        return (
          <ObjectionHandlingStep
            config={agentConfig.objectionHandling}
            onUpdate={(data) => updateConfig("objectionHandling", data)}
            selectedShop={selectedShop}
            shopInfo={shopInfo}
            errors={
              validationAttempted[6]
                ? getStepErrors(
                    "objectionHandling",
                    agentConfig.objectionHandling
                  )
                : {}
            }
          />
        );
      case 7:
        return (
          <LaunchTestStep
            config={agentConfig.testLaunch}
            agentConfig={agentConfig.agentPersona}
            onUpdate={(data) => updateConfig("testLaunch", data)}
            onSave={handleSave}
            loading={loading}
            selectedShop={selectedShop}
            shopInfo={shopInfo}
            errors={
              validationAttempted[7]
                ? getStepErrors("testLaunch", agentConfig.testLaunch)
                : {}
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className=" p-6 pb-0 mb-4">
        <div className="flex-shrink-0 pb-4 flex w-full border-b  border-[#EAECF0] justify-between items-start   ">
          <div className="flex items-center gap-4">
            <span
              className="cursor-pointer border-[#D0D5DD] border p-2 rounded-sm"
              onClick={() => router.push("/agent")}
            >
              {" "}
              <BackIcon />{" "}
            </span>
            <h1 className="text-xl font-medium flex items-center  text-[#000000]">
              Agents{" "}
              <span className="text-sm flex items-center mt-[2px]  text-gray-500">
                {" "}
                <BackIcon
                  strokeWidth="1.5"
                  className="rotate-180   text-gray-500"
                />{" "}
                Configure
              </span>
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live Toggle */}
            <div className="flex items-center space-x-4">
              <span className="text-xs font-medium text-gray-700">Live</span>
              <button
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  agent?.status === "active" ? "bg-purple-500" : "bg-gray-200"
                }`}
                onClick={handleToggleStatus}
                disabled={loading}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    agent?.status === "active"
                      ? "translate-x-5"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Save Changes Button - Only show if not in draft mode */}
            {agent?.status !== "draft" && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-gray-900  text-white px-4 py-2 rounded-sm cursor-pointer leading-[24px] hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading
                  ? "Saving..."
                  : agent?.status === "inactive"
                  ? "Save & Make Live"
                  : "Save Changes"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className="w-64  pl-6 pr-4 pb-6  flex flex-col">
          <div className="">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center space-x-2 py-3 px-2 cursor-pointer transition-colors ${
                    currentStep === step.id
                      ? "bg-gradient-to-r from-[#f6f3ff] to-[#fcfbff]  border-b border-gray-100"
                      : "border-b border-gray-200"
                  }`}
                >
                  <div
                    className={`border font-medium border-gray-200 text-gray-900 rounded-sm text-xs  bg-white py-0.5 leading-4 ${
                      step.id === 1 ? "px-2" : "px-1.5"
                    }`}
                  >
                    {step.id}
                  </div>
                  <span
                    className={`font-medium text-xs ${
                      currentStep === step.id
                        ? "text-purple-700"
                        : "text-gray-900"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Help Section */}
          <div className="mt-auto p-4 border relative bg-gray-50  border-gray-200 rounded-lg">
            <div className="flex items-center justify-center absolute top-0 right-0">
              <svg
                width="94"
                height="94"
                viewBox="0 0 94 94"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  opacity="0.6"
                  cx="70.5"
                  cy="23.1797"
                  r="45"
                  stroke="#EAECF0"
                />
                <circle
                  opacity="0.8"
                  cx="70.5"
                  cy="23.1797"
                  r="32"
                  stroke="#EAECF0"
                />
                <circle
                  opacity="0.4"
                  cx="70.5"
                  cy="23.1797"
                  r="58"
                  stroke="#EAECF0"
                />
                <circle
                  opacity="0.2"
                  cx="70.5"
                  cy="23.1797"
                  r="70"
                  stroke="#EAECF0"
                />
                <path
                  d="M66.7197 19.2901C66.9759 18.5007 67.4452 17.7981 68.0762 17.2589C68.7071 16.7197 69.4757 16.3654 70.2954 16.2353C71.1151 16.1053 71.9543 16.2043 72.7212 16.5217C73.4881 16.8392 74.1522 17.3628 74.6401 18.0342C75.1281 18.7056 75.4203 19.4985 75.4856 20.3259C75.5508 21.1533 75.3858 21.9829 75.009 22.7224C74.6323 23.462 74.0591 24.0824 73.3514 24.5161C72.6438 24.9498 71.83 25.1793 71 25.1793V26.68M71 37.1797C63.5442 37.1797 57.5 31.1355 57.5 23.6797C57.5 16.2238 63.5442 10.1797 71 10.1797C78.4558 10.1797 84.5 16.2238 84.5 23.6797C84.5 31.1355 78.4558 37.1797 71 37.1797ZM71.0747 31.1797V31.3297L70.9253 31.33V31.1797H71.0747Z"
                  stroke="#D0D5DD"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex items-center  ">
              <span className="text-lg font-semibold text-gray-950">
                Need help?
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              If you're feeling stuck, you can book a call with us.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1   flex flex-col min-h-0">
          <div className="flex-1 border-l border-gray-200 overflow-y-auto p-6 min-h-0">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex-shrink-0 p-4 pb-6  border-t border-gray-200  bg-white">
            <div className="flex justify-center items-center space-x-4 font-medium">
              <button
                onClick={handlePreviousStep}
                disabled={currentStep === 1}
                className="bg-white border w-[172px] border-gray-300 rounded-sm  text-gray-900 px-4 py-2  cursor-pointer leading-[24px] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <span>Previous</span>
              </button>

              <div className="flex space-x-3">
                {currentStep < 7 ? (
                  <button
                    onClick={handleNextStep}
                    disabled={savingStep}
                    className="bg-gray-900 w-[172px]  text-white px-4 py-2 rounded-sm cursor-pointer leading-[24px] hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <span>{savingStep ? "Saving..." : "Next"}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleMakeLive}
                    disabled={isMakingLive || loading || savingStep}
                    className="bg-purple-600 w-[172px] text-white px-4 py-2 rounded-sm cursor-pointer leading-[24px] hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <span>
                      {savingStep
                        ? "Saving..."
                        : isMakingLive
                        ? "Making Live..."
                        : "Make Agent Live"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentWizard;
