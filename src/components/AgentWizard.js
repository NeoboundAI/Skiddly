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

const AgentWizard = ({ agent, selectedShop, onSave, agentId }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [agentConfig, setAgentConfig] = useState({
    // Step 1: Store Profile
    storeProfile: {
      storeName:
        agent?.storeProfile?.storeName ||
        selectedShop?.shop?.replace(".myshopify.com", "") ||
        "",
      storeUrl: agent?.storeProfile?.storeUrl || selectedShop?.shop || "",
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
      expressProviders: agent?.commerceSettings?.expressProviders || [
        "shop-pay",
        "paypal",
        "google-pay",
        "apple-pay",
      ],
      paymentsAccepted:
        agent?.commerceSettings?.paymentsAccepted || "Visa, Mastercard, Amex",
      bnplProviders:
        agent?.commerceSettings?.bnplProviders || "Klarna, Afterpay",
      guestCheckoutEnabled:
        agent?.commerceSettings?.guestCheckoutEnabled ?? true,
      discountsNotes: agent?.commerceSettings?.discountsNotes || "",
      discountTypes: agent?.commerceSettings?.discountTypes || [
        "military",
        "student",
        "first-responder",
      ],
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
        waitTime: agent?.callLogic?.callSchedule?.waitTime || "2",
        waitTimeUnit: agent?.callLogic?.callSchedule?.waitTimeUnit || "hours",
        maxRetries: agent?.callLogic?.callSchedule?.maxRetries || "3",
        retryInterval: agent?.callLogic?.callSchedule?.retryInterval || "24",
        retryIntervalUnit:
          agent?.callLogic?.callSchedule?.retryIntervalUnit || "hours",
        weekendCalling: agent?.callLogic?.callSchedule?.weekendCalling ?? false,
        callTimeStart: agent?.callLogic?.callSchedule?.callTimeStart || "09:00",
        callTimeEnd: agent?.callLogic?.callSchedule?.callTimeEnd || "18:00",
        timezone:
          agent?.callLogic?.callSchedule?.timezone || "America/New_York",
        respectDND: agent?.callLogic?.callSchedule?.respectDND ?? true,
        voicemailDetection:
          agent?.callLogic?.callSchedule?.voicemailDetection ?? true,
      },
    },

    // Step 4: Offer Engine
    offerEngine: {
      shopifyDiscountCodes: agent?.offerEngine?.shopifyDiscountCodes || [],
      primaryDiscountCode: agent?.offerEngine?.primaryDiscountCode || "",
      primaryDiscountValue: agent?.offerEngine?.primaryDiscountValue || "",
      offerShippingDiscount: agent?.offerEngine?.offerShippingDiscount ?? false,
      shippingDiscountText: agent?.offerEngine?.shippingDiscountText || "",
      offerPaymentPlans: agent?.offerEngine?.offerPaymentPlans ?? false,
      returnPolicy: agent?.offerEngine?.returnPolicy || "30 days return",
    },

    // Step 5: Agent Persona
    agentPersona: {
      agentName: agent?.agentPersona?.agentName || "Sarah",
      language: agent?.agentPersona?.language || "English (US)",
      voiceStyle:
        agent?.agentPersona?.voiceStyle || "sarah-professional-female",
      greetingStyle: agent?.agentPersona?.greetingStyle || "standard",
      customGreeting: agent?.agentPersona?.customGreeting || "",
    },

    // Step 6: Objection Handling
    objectionHandling: {
      shipping: agent?.objectionHandling?.shipping ?? true,
      price: agent?.objectionHandling?.price ?? true,
      size: agent?.objectionHandling?.size ?? true,
      payment: agent?.objectionHandling?.payment ?? true,
      technical: agent?.objectionHandling?.technical ?? true,
      comparison: agent?.objectionHandling?.comparison ?? true,
      forgot: agent?.objectionHandling?.forgot ?? true,
      shippingResponse: agent?.objectionHandling?.shippingResponse || "",
      priceResponse: agent?.objectionHandling?.priceResponse || "",
      sizeResponse: agent?.objectionHandling?.sizeResponse || "",
      paymentResponse: agent?.objectionHandling?.paymentResponse || "",
      technicalResponse: agent?.objectionHandling?.technicalResponse || "",
      comparisonResponse: agent?.objectionHandling?.comparisonResponse || "",
      forgotResponse: agent?.objectionHandling?.forgotResponse || "",
    },

    // Step 7: Launch & Test
    launchTest: {
      testCallsCompleted: agent?.launchTest?.testCallsCompleted || 0,
      validationStatus: agent?.launchTest?.validationStatus || "pending",
      deploymentStatus: agent?.launchTest?.deploymentStatus || "draft",
      testResults: agent?.launchTest?.testResults || [],
    },
  });

  // Update agentConfig when agent prop changes
  useEffect(() => {
    if (agent) {
      setAgentConfig({
        // Step 1: Store Profile
        storeProfile: {
          storeName:
            agent.storeProfile?.storeName ||
            selectedShop?.shop?.replace(".myshopify.com", "") ||
            "",
          storeUrl: agent.storeProfile?.storeUrl || selectedShop?.shop || "",
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
          expressProviders: agent.commerceSettings?.expressProviders || [
            "shop-pay",
            "paypal",
            "google-pay",
            "apple-pay",
          ],
          paymentsAccepted:
            agent.commerceSettings?.paymentsAccepted ||
            "Visa, Mastercard, Amex",
          bnplProviders:
            agent.commerceSettings?.bnplProviders || "Klarna, Afterpay",
          guestCheckoutEnabled:
            agent.commerceSettings?.guestCheckoutEnabled ?? true,
          discountsNotes: agent.commerceSettings?.discountsNotes || "",
          discountTypes: agent.commerceSettings?.discountTypes || [
            "military",
            "student",
            "first-responder",
          ],
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
            waitTime: agent.callLogic?.callSchedule?.waitTime || "2",
            waitTimeUnit:
              agent.callLogic?.callSchedule?.waitTimeUnit || "hours",
            maxRetries: agent.callLogic?.callSchedule?.maxRetries || "3",
            retryInterval: agent.callLogic?.callSchedule?.retryInterval || "24",
            retryIntervalUnit:
              agent.callLogic?.callSchedule?.retryIntervalUnit || "hours",
            weekendCalling:
              agent.callLogic?.callSchedule?.weekendCalling ?? false,
            callTimeStart:
              agent.callLogic?.callSchedule?.callTimeStart || "09:00",
            callTimeEnd: agent.callLogic?.callSchedule?.callTimeEnd || "18:00",
            timezone:
              agent.callLogic?.callSchedule?.timezone || "America/New_York",
            respectDND: agent.callLogic?.callSchedule?.respectDND ?? true,
            voicemailDetection:
              agent.callLogic?.callSchedule?.voicemailDetection ?? true,
          },
        },

        // Step 4: Offer Engine
        offerEngine: {
          shopifyDiscountCodes: agent.offerEngine?.shopifyDiscountCodes || [],
          primaryDiscountCode: agent.offerEngine?.primaryDiscountCode || "",
          primaryDiscountValue: agent.offerEngine?.primaryDiscountValue || "",
          offerShippingDiscount:
            agent.offerEngine?.offerShippingDiscount ?? false,
          shippingDiscountText: agent.offerEngine?.shippingDiscountText || "",
          offerPaymentPlans: agent.offerEngine?.offerPaymentPlans ?? false,
          returnPolicy: agent.offerEngine?.returnPolicy || "30 days return",
        },

        // Step 5: Agent Persona
        agentPersona: {
          agentName: agent.agentPersona?.agentName || "Sarah",
          language: agent.agentPersona?.language || "English (US)",
          voiceStyle:
            agent.agentPersona?.voiceStyle || "sarah-professional-female",
          greetingStyle: agent.agentPersona?.greetingStyle || "standard",
          customGreeting: agent.agentPersona?.customGreeting || "",
        },

        // Step 6: Objection Handling
        objectionHandling: {
          shipping: agent.objectionHandling?.shipping ?? true,
          price: agent.objectionHandling?.price ?? true,
          size: agent.objectionHandling?.size ?? true,
          payment: agent.objectionHandling?.payment ?? true,
          technical: agent.objectionHandling?.technical ?? true,
          comparison: agent.objectionHandling?.comparison ?? true,
          forgot: agent.objectionHandling?.forgot ?? true,
          shippingResponse: agent.objectionHandling?.shippingResponse || "",
          priceResponse: agent.objectionHandling?.priceResponse || "",
          sizeResponse: agent.objectionHandling?.sizeResponse || "",
          paymentResponse: agent.objectionHandling?.paymentResponse || "",
          technicalResponse: agent.objectionHandling?.technicalResponse || "",
          comparisonResponse: agent.objectionHandling?.comparisonResponse || "",
          forgotResponse: agent.objectionHandling?.forgotResponse || "",
        },

        // Step 7: Launch & Test
        launchTest: {
          testCallsCompleted: agent.launchTest?.testCallsCompleted || 0,
          validationStatus: agent.launchTest?.validationStatus || "pending",
          deploymentStatus: agent.launchTest?.deploymentStatus || "draft",
          testResults: agent.launchTest?.testResults || [],
        },
      });
    }
  }, [agent, selectedShop]);

  const steps = [
    { id: 1, name: "Store Profile", icon: FiShoppingBag },
    { id: 2, name: "Commerce Settings", icon: FiCreditCard },
    { id: 3, name: "Call Logic", icon: FiPhone },
    { id: 4, name: "Offer Engine", icon: FiGift },
    { id: 5, name: "Agent Persona", icon: FiUser },
    { id: 6, name: "Objection Handling", icon: FiMessageSquare },
    { id: 7, name: "Launch & Test", icon: FiPlay },
  ];

  const updateConfig = (section, data) => {
    setAgentConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }));
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
        launchTest: agentConfig.launchTest,
      };

      await axios.put(`/api/agents/${agentId}`, updateData);
      if (onSave) onSave();
    } catch (error) {
      console.error("Error saving agent:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StoreProfileStep
            config={agentConfig.storeProfile}
            onUpdate={(data) => updateConfig("storeProfile", data)}
            selectedShop={selectedShop}
          />
        );
      case 2:
        return (
          <CommerceSettingsStep
            config={agentConfig.commerceSettings}
            onUpdate={(data) => updateConfig("commerceSettings", data)}
          />
        );
      case 3:
        return (
          <CallLogicStep
            config={agentConfig.callLogic}
            onUpdate={(data) => updateConfig("callLogic", data)}
          />
        );
      case 4:
        return (
          <OfferEngineStep
            config={agentConfig.offerEngine}
            onUpdate={(data) => updateConfig("offerEngine", data)}
          />
        );
      case 5:
        return (
          <AgentPersonaStep
            config={agentConfig.agentPersona}
            onUpdate={(data) => updateConfig("agentPersona", data)}
          />
        );
      case 6:
        return (
          <ObjectionHandlingStep
            config={agentConfig.objectionHandling}
            onUpdate={(data) => updateConfig("objectionHandling", data)}
          />
        );
      case 7:
        return (
          <LaunchTestStep
            config={agentConfig.launchTest}
            onUpdate={(data) => updateConfig("launchTest", data)}
            onSave={handleSave}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex w-full justify-between items-center border-b border-[#EAECF0] pb-4 p-6 ">
        <div>
          <h1 className="text-xl font-semibold text-[#000000]">
            {steps[currentStep - 1]?.name || "Configure Agent"}
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            {steps[currentStep - 1]?.name === "Store Profile"
              ? "Capture store name, address, type, operating hours, shipping methods."
              : "Configure your agent settings"}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Live Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-700">Live</span>
            <button
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                agent?.status === "active" ? "bg-purple-600" : "bg-gray-200"
              }`}
              onClick={() => {
                // Toggle live status
                const newStatus =
                  agent?.status === "active" ? "draft" : "active";
                // You can add API call here to update agent status
              }}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  agent?.status === "active" ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Save Changes Button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 p-3 border-r border-gray-200 flex flex-col">
          <div className="space-y-1">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    isActive
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : isCompleted
                      ? "bg-green-50 text-green-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setCurrentStep(step.id)}
                >
                  <div
                    className={`flex items-center justify-center w-5 h-5 rounded-full ${
                      isActive
                        ? "bg-purple-600 text-white"
                        : isCompleted
                        ? "bg-green-600 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {isCompleted ? (
                      <FiCheckCircle className="w-2.5 h-2.5" />
                    ) : (
                      <Icon className="w-2.5 h-2.5" />
                    )}
                  </div>
                  <span className="font-medium text-xs">{step.name}</span>
                </div>
              );
            })}
          </div>

          {/* Help Section */}
          <div className="mt-auto pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs">?</span>
              </div>
              <span className="text-xs">Need help?</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              If you're feeling stuck, you can book a call with us.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex-shrink-0 border-t border-gray-200 p-3 bg-white">
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="flex items-center space-x-2 px-3 py-1.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <FiChevronLeft className="w-3 h-3" />
                <span>Previous</span>
              </button>

              <div className="flex space-x-3">
                {currentStep < 7 && (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="flex items-center space-x-2 px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    <span>Next</span>
                    <FiChevronRight className="w-3 h-3" />
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
