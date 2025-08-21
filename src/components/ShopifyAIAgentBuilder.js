"use client";

import React, { useState, useEffect } from "react";
import {
  FiChevronRight,
  FiChevronLeft,
  FiShoppingBag,
  FiUser,
  FiPhone,
  FiSettings,
  FiCheckCircle,
  FiPlay,
  FiPause,
  FiVolume2,
} from "react-icons/fi";

const ShopifyAIAgentBuilder = ({
  templateAgent,
  selectedShop,
  onCreateAgent,
  initialConfig,
  agentId,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  console.log(templateAgent);
  const [agentConfig, setAgentConfig] = useState({
    storeName:
      initialConfig?.storeName ||
      selectedShop?.shop?.replace(".myshopify.com", "") ||
      "",
    storeCategory: initialConfig?.storeCategory || "",
    storeDescription: initialConfig?.storeDescription || "",
    agentName: initialConfig?.agentName || generateRandomName(),
    language: initialConfig?.language || "en-US",
    voiceStyle: initialConfig?.voiceStyle || "professional-female",
    discountCode: initialConfig?.discountCode || "",
    discountPercentage: initialConfig?.discountPercentage || "",
    hasShippingDiscount: initialConfig?.hasShippingDiscount || false,
    shippingDiscountAmount: initialConfig?.shippingDiscountAmount || "",
    hasPaymentPlans: initialConfig?.hasPaymentPlans || false,
    returnPolicy: initialConfig?.returnPolicy || "30 days",
    greeting: initialConfig?.greeting || "standard",
    customGreeting: initialConfig?.customGreeting || "",
    callTriggers: {
      abandonedCart: initialConfig?.callTriggers?.abandonedCart ?? true,
      cartValueMin: initialConfig?.callTriggers?.cartValueMin || "",
      cartValueMax: initialConfig?.callTriggers?.cartValueMax || "",
      waitTime: initialConfig?.callTriggers?.waitTime || "2",
      waitTimeUnit: initialConfig?.callTriggers?.waitTimeUnit || "hours",
    },
    callSettings: {
      maxRetries: initialConfig?.callSettings?.maxRetries || "3",
      retryInterval: initialConfig?.callSettings?.retryInterval || "24",
      retryIntervalUnit:
        initialConfig?.callSettings?.retryIntervalUnit || "hours",
      weekendCalling: initialConfig?.callSettings?.weekendCalling ?? false,
      callTimeStart: initialConfig?.callSettings?.callTimeStart || "09:00",
      callTimeEnd: initialConfig?.callSettings?.callTimeEnd || "18:00",
      timezone: initialConfig?.callSettings?.timezone || "America/New_York",
      respectDND: initialConfig?.callSettings?.respectDND ?? true,
      voicemailDetection:
        initialConfig?.callSettings?.voicemailDetection ?? true,
    },
    objectionHandling: {
      shipping: initialConfig?.objectionHandling?.shipping ?? true,
      price: initialConfig?.objectionHandling?.price ?? true,
      size: initialConfig?.objectionHandling?.size ?? true,
      payment: initialConfig?.objectionHandling?.payment ?? true,
      technical: initialConfig?.objectionHandling?.technical ?? true,
      comparison: initialConfig?.objectionHandling?.comparison ?? true,
      forgot: initialConfig?.objectionHandling?.forgot ?? true,
    },
    enableSmartEscalation: initialConfig?.enableSmartEscalation ?? false,
    enableFollowUp: initialConfig?.enableFollowUp ?? false,
  });

  // Function to extract sections from template system prompt
  const extractTemplateSections = (systemPrompt) => {
    if (!systemPrompt) return {};

    const sections = {};

    // Extract Incentive Offering section
    const incentiveMatch = systemPrompt.match(
      /Incentive Offering \(When Appropriate\):\s*"([^"]+)"/
    );
    if (incentiveMatch) {
      sections.incentiveOffering = incentiveMatch[1];
    }

    // Extract Order Completion Assistance section
    const orderCompletionMatch = systemPrompt.match(
      /Order Completion Assistance:\s*"([^"]+)"/
    );
    if (orderCompletionMatch) {
      sections.orderCompletion = orderCompletionMatch[1];
    }

    // Extract Alternative if Not Ready Now section
    const alternativeMatch = systemPrompt.match(
      /Alternative if Not Ready Now:\s*"([^"]+)"/
    );
    if (alternativeMatch) {
      sections.alternativeNotReady = alternativeMatch[1];
    }

    // Extract If customer is busy section
    const busyMatch = systemPrompt.match(/If customer is busy:\s*"([^"]+)"/);
    if (busyMatch) {
      sections.customerBusy = busyMatch[1];
    }

    // Extract If still busy section
    const stillBusyMatch = systemPrompt.match(/If still busy:\s*"([^"]+)"/);
    if (stillBusyMatch) {
      sections.stillBusy = stillBusyMatch[1];
    }

    // Extract If customer doesn't remember shopping section
    const forgotMatch = systemPrompt.match(
      /If customer doesn't remember shopping:\s*"([^"]+)"/
    );
    if (forgotMatch) {
      sections.doesntRemember = forgotMatch[1];
    }

    // Extract If customer is not interested anymore section
    const notInterestedMatch = systemPrompt.match(
      /If customer is not interested anymore:\s*"([^"]+)"/
    );
    if (notInterestedMatch) {
      sections.notInterested = notInterestedMatch[1];
    }

    // Extract If customer had bad experience section
    const badExperienceMatch = systemPrompt.match(
      /If customer had bad experience:\s*"([^"]+)"/
    );
    if (badExperienceMatch) {
      sections.badExperience = badExperienceMatch[1];
    }

    // Extract If customer wants to think more section
    const thinkMoreMatch = systemPrompt.match(
      /If customer wants to think more:\s*"([^"]+)"/
    );
    if (thinkMoreMatch) {
      sections.wantsToThink = thinkMoreMatch[1];
    }

    // Extract If customer asks about return policy section
    const returnPolicyMatch = systemPrompt.match(
      /If customer asks about return policy:\s*"([^"]+)"/
    );
    if (returnPolicyMatch) {
      sections.returnPolicy = returnPolicyMatch[1];
    }

    // Extract If customer prefers to shop online section
    const shopOnlineMatch = systemPrompt.match(
      /If customer prefers to shop online:\s*"([^"]+)"/
    );
    if (shopOnlineMatch) {
      sections.prefersOnline = shopOnlineMatch[1];
    }

    return sections;
  };

  // Update config when template or selectedShop changes
  useEffect(() => {
    if (templateAgent) {
      const templateSections = extractTemplateSections(
        templateAgent.model?.messages?.[0]?.content
      );

      setAgentConfig((prev) => ({
        ...prev,
        language: templateAgent.model?.language || "en-US",
        voiceStyle: templateAgent.voice?.style || "professional-female",
        greeting: templateAgent.firstMessage ? "custom" : "standard",
        customGreeting: templateAgent.firstMessage || "",
        templateSections: templateSections,
      }));
    }
  }, [templateAgent]);

  useEffect(() => {
    if (selectedShop) {
      setAgentConfig((prev) => ({
        ...prev,
        storeName: selectedShop.shop?.replace(".myshopify.com", "") || "",
        storeDescription: `Your trusted ${selectedShop.shop?.replace(
          ".myshopify.com",
          ""
        )} store for quality products and excellent service.`,
      }));
    }
  }, [selectedShop]);

  function generateRandomName() {
    const names = [
      "Sarah",
      "Mike",
      "Emma",
      "David",
      "Lisa",
      "John",
      "Anna",
      "Chris",
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  const steps = [
    { id: 1, title: "Store Setup", icon: FiShoppingBag },
    { id: 2, title: "Agent Personality", icon: FiUser },
    { id: 3, title: "Offers & Discounts", icon: FiSettings },
    { id: 4, title: "Call Configuration", icon: FiPhone },
    { id: 5, title: "Objection Handling", icon: FiCheckCircle },
    { id: 6, title: "Preview & Deploy", icon: FiCheckCircle },
  ];

  const voiceOptions = [
    {
      id: "professional-female",
      name: "Sarah - Professional Female",
      accent: "American",
    },
    { id: "friendly-male", name: "Mike - Friendly Male", accent: "American" },
    { id: "warm-female", name: "Emma - Warm Female", accent: "American" },
    {
      id: "confident-male",
      name: "David - Confident Male",
      accent: "American",
    },
  ];

  const updateConfig = (key, value) => {
    setAgentConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateNestedConfig = (parent, key, value) => {
    setAgentConfig((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [key]: value },
    }));
  };

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleDeploy = async () => {
    try {
      await onCreateAgent(agentConfig);
    } catch (error) {
      console.error("Error deploying agent:", error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Store Setup
            </h2>
            <p className="text-gray-600">
              Let's start with your store information
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shopify Store Name
                  </label>
                  <input
                    type="text"
                    value={agentConfig.storeName}
                    onChange={(e) => updateConfig("storeName", e.target.value)}
                    placeholder="e.g., Fashion Forward Boutique"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Category
                  </label>
                  <select
                    value={agentConfig.storeCategory}
                    onChange={(e) =>
                      updateConfig("storeCategory", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select your store category</option>
                    <option value="fashion">Fashion & Apparel</option>
                    <option value="electronics">Electronics & Tech</option>
                    <option value="beauty">Beauty & Cosmetics</option>
                    <option value="home">Home & Garden</option>
                    <option value="sports">Sports & Fitness</option>
                    <option value="jewelry">Jewelry & Accessories</option>
                    <option value="books">Books & Media</option>
                    <option value="toys">Toys & Games</option>
                    <option value="food">Food & Beverage</option>
                    <option value="health">Health & Wellness</option>
                    <option value="automotive">Automotive</option>
                    <option value="pets">Pet Supplies</option>
                    <option value="crafts">Arts & Crafts</option>
                    <option value="baby">Baby & Kids</option>
                    <option value="services">Digital Services</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Description
                </label>
                <textarea
                  value={agentConfig.storeDescription}
                  onChange={(e) =>
                    updateConfig("storeDescription", e.target.value)
                  }
                  placeholder="Describe your store and what makes it special..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Agent Personality
            </h2>
            <p className="text-gray-600">
              Customize how your AI agent sounds and behaves
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={agentConfig.agentName}
                  onChange={(e) => updateConfig("agentName", e.target.value)}
                  placeholder="e.g., Sarah, Mike, Emma"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Language
                </label>
                <select
                  value={agentConfig.language}
                  onChange={(e) => updateConfig("language", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="en-AU">English (Australian)</option>
                  <option value="es-US">Spanish (US)</option>
                  <option value="es-ES">Spanish (Spain)</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="it-IT">Italian</option>
                  <option value="pt-BR">Portuguese (Brazil)</option>
                  <option value="ja-JP">Japanese</option>
                  <option value="ko-KR">Korean</option>
                  <option value="zh-CN">Chinese (Mandarin)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Voice Style
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {voiceOptions.map((voice) => (
                    <div
                      key={voice.id}
                      onClick={() => updateConfig("voiceStyle", voice.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        agentConfig.voiceStyle === voice.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {voice.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {voice.accent}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Offers & Discounts
            </h2>
            <p className="text-gray-600">
              Set up incentives to recover abandoned carts
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Discount Code (Manual Entry)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={agentConfig.discountCode}
                    onChange={(e) =>
                      updateConfig("discountCode", e.target.value)
                    }
                    placeholder="e.g., SAVE15"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    value={agentConfig.discountPercentage}
                    onChange={(e) =>
                      updateConfig("discountPercentage", e.target.value)
                    }
                    placeholder="% off (e.g., 15)"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={agentConfig.hasShippingDiscount}
                    onChange={(e) =>
                      updateConfig("hasShippingDiscount", e.target.checked)
                    }
                    className="mr-3"
                  />
                  <span className="font-medium">
                    Offer Free/Discounted Shipping
                  </span>
                </label>

                {agentConfig.hasShippingDiscount && (
                  <div className="mt-3 ml-6">
                    <input
                      type="text"
                      value={agentConfig.shippingDiscountAmount}
                      onChange={(e) =>
                        updateConfig("shippingDiscountAmount", e.target.value)
                      }
                      placeholder="e.g., Free shipping or $5 off"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return Policy
                </label>
                <select
                  value={agentConfig.returnPolicy}
                  onChange={(e) => updateConfig("returnPolicy", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="30 days">30 days return</option>
                  <option value="60 days">60 days return</option>
                  <option value="90 days">90 days return</option>
                  <option value="lifetime">Lifetime return</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Call Configuration
            </h2>
            <p className="text-gray-600">
              Set up smart rules for when your AI agent should reach out to
              customers
            </p>

            <div className="space-y-6">
              <div className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    1
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    When to Call
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={agentConfig.callTriggers.abandonedCart}
                      onChange={(e) =>
                        updateNestedConfig(
                          "callTriggers",
                          "abandonedCart",
                          e.target.checked
                        )
                      }
                      className="mr-4 w-5 h-5 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        Customer abandons cart
                      </div>
                      <div className="text-sm text-gray-600">
                        Call when items are left in cart without purchase
                      </div>
                    </div>
                  </div>

                  {agentConfig.callTriggers.abandonedCart && (
                    <div className="ml-9 bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wait time before calling
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={agentConfig.callTriggers.waitTime}
                          onChange={(e) =>
                            updateNestedConfig(
                              "callTriggers",
                              "waitTime",
                              e.target.value
                            )
                          }
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                          max="72"
                        />
                        <select
                          value={agentConfig.callTriggers.waitTimeUnit}
                          onChange={(e) =>
                            updateNestedConfig(
                              "callTriggers",
                              "waitTimeUnit",
                              e.target.value
                            )
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                        </select>
                        <span className="text-sm text-gray-600">
                          after cart abandonment
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border-2 border-orange-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    2
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Call Timing & Retries
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      🕐 Calling Hours
                    </h4>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business hours
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Start time
                          </label>
                          <input
                            type="time"
                            value={agentConfig.callSettings.callTimeStart}
                            onChange={(e) =>
                              updateNestedConfig(
                                "callSettings",
                                "callTimeStart",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            End time
                          </label>
                          <input
                            type="time"
                            value={agentConfig.callSettings.callTimeEnd}
                            onChange={(e) =>
                              updateNestedConfig(
                                "callSettings",
                                "callTimeEnd",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      🔄 If No Answer
                    </h4>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum attempts
                      </label>
                      <select
                        value={agentConfig.callSettings.maxRetries}
                        onChange={(e) =>
                          updateNestedConfig(
                            "callSettings",
                            "maxRetries",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="1">1 call only</option>
                        <option value="2">2 calls total</option>
                        <option value="3">3 calls total</option>
                        <option value="4">4 calls total</option>
                        <option value="5">5 calls total</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Objection Handling
            </h2>
            <p className="text-gray-600">
              Customize how your AI responds to customer concerns
            </p>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">
                  💡 Smart Responses
                </h3>
                <p className="text-sm text-blue-800">
                  Use our proven templates or customize responses to match your
                  brand voice
                </p>
              </div>

              {/* Template-based responses from VAPI */}
              {agentConfig.templateSections &&
                Object.keys(agentConfig.templateSections).length > 0 && (
                  <>
                    {[
                      {
                        key: "incentiveOffering",
                        title: "Incentive Offering",
                        desc: "When offering discounts or special deals",
                        templateResponse:
                          agentConfig.templateSections.incentiveOffering,
                      },
                      {
                        key: "orderCompletion",
                        title: "Order Completion Assistance",
                        desc: "When helping customers complete their order",
                        templateResponse:
                          agentConfig.templateSections.orderCompletion,
                      },
                      {
                        key: "alternativeNotReady",
                        title: "Alternative if Not Ready Now",
                        desc: "When customers need time to decide",
                        templateResponse:
                          agentConfig.templateSections.alternativeNotReady,
                      },
                      {
                        key: "customerBusy",
                        title: "If Customer is Busy",
                        desc: "When customers are busy during the call",
                        templateResponse:
                          agentConfig.templateSections.customerBusy,
                      },
                      {
                        key: "stillBusy",
                        title: "If Still Busy",
                        desc: "When customers remain busy after first attempt",
                        templateResponse:
                          agentConfig.templateSections.stillBusy,
                      },
                      {
                        key: "doesntRemember",
                        title: "If Customer Doesn't Remember Shopping",
                        desc: "When customers don't recall their cart",
                        templateResponse:
                          agentConfig.templateSections.doesntRemember,
                      },
                      {
                        key: "notInterested",
                        title: "If Customer is Not Interested Anymore",
                        desc: "When customers have changed their mind",
                        templateResponse:
                          agentConfig.templateSections.notInterested,
                      },
                      {
                        key: "badExperience",
                        title: "If Customer Had Bad Experience",
                        desc: "When addressing previous negative experiences",
                        templateResponse:
                          agentConfig.templateSections.badExperience,
                      },
                      {
                        key: "wantsToThink",
                        title: "If Customer Wants to Think More",
                        desc: "When customers need more time to decide",
                        templateResponse:
                          agentConfig.templateSections.wantsToThink,
                      },
                      {
                        key: "returnPolicy",
                        title: "If Customer Asks About Return Policy",
                        desc: "When customers inquire about returns",
                        templateResponse:
                          agentConfig.templateSections.returnPolicy,
                      },
                      {
                        key: "prefersOnline",
                        title: "If Customer Prefers to Shop Online",
                        desc: "When customers want to complete purchase online",
                        templateResponse:
                          agentConfig.templateSections.prefersOnline,
                      },
                    ]
                      .filter((item) => item.templateResponse)
                      .map((objection) => (
                        <div
                          key={objection.key}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start">
                              <input
                                type="checkbox"
                                checked={
                                  agentConfig.objectionHandling[
                                    objection.key
                                  ] !== false
                                }
                                onChange={(e) =>
                                  updateNestedConfig(
                                    "objectionHandling",
                                    objection.key,
                                    e.target.checked
                                  )
                                }
                                className="mr-3 mt-1"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {objection.title}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {objection.desc}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              onClick={() => {
                                // Toggle between default and custom mode
                                const currentMode =
                                  agentConfig.objectionHandling[
                                    `${objection.key}Mode`
                                  ] || "default";
                                updateNestedConfig(
                                  "objectionHandling",
                                  `${objection.key}Mode`,
                                  currentMode === "default"
                                    ? "custom"
                                    : "default"
                                );
                              }}
                            >
                              {agentConfig.objectionHandling[
                                `${objection.key}Mode`
                              ] === "custom"
                                ? "Use Default"
                                : "Customize"}
                            </button>
                          </div>

                          {agentConfig.objectionHandling[
                            `${objection.key}Mode`
                          ] === "custom" ? (
                            <div className="mt-3 pl-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Custom Response:
                              </label>
                              <textarea
                                value={
                                  agentConfig.objectionHandling[
                                    `${objection.key}Custom`
                                  ] || objection.templateResponse
                                }
                                onChange={(e) =>
                                  updateNestedConfig(
                                    "objectionHandling",
                                    `${objection.key}Custom`,
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                                rows="3"
                                placeholder="Enter your custom response..."
                              />
                              <p className="text-xs text-gray-500 mt-1 flex items-center">
                                <span className="mr-1">💡</span>
                                Tip: Keep responses conversational and
                                solution-focused. Use variables like
                                [CustomerName], [ProductName], [DiscountCode]
                              </p>
                            </div>
                          ) : (
                            <div className="mt-3 pl-6 p-3 bg-gray-50 rounded text-sm text-gray-700 border-l-4 border-blue-500">
                              <strong>Default response:</strong> "
                              {objection.templateResponse}"
                            </div>
                          )}
                        </div>
                      ))}
                  </>
                )}

              {/* Original objection handling sections */}
              {[
                {
                  key: "shipping",
                  title: "Shipping Cost Concerns",
                  desc: "When customers complain about shipping fees",
                  defaultResponse:
                    "I completely understand — actually, we sometimes offer free or discounted shipping. Would it help if I sent you today's best shipping offer?",
                },
                {
                  key: "price",
                  title: "Price Objections",
                  desc: "When customers say items are too expensive",
                  defaultResponse:
                    "I hear you — pricing matters. I can check if there's any ongoing discount, or I can share a quick offer code you could use today.",
                },
                {
                  key: "payment",
                  title: "Payment Issues",
                  desc: "When checkout or payment fails",
                  defaultResponse:
                    "Ah, that's frustrating. I can send you a quick payment link now on WhatsApp or SMS — it should only take a minute to complete your order.",
                },
                {
                  key: "technical",
                  title: "Technical Problems",
                  desc: "Website bugs or technical issues",
                  defaultResponse:
                    "I'm sorry you experienced that. Let me send you a direct checkout link that should work smoothly, or I can help you complete the order over the phone right now.",
                },
              ].map((objection) => (
                <div
                  key={objection.key}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start mb-3">
                    <input
                      type="checkbox"
                      checked={
                        agentConfig.objectionHandling[objection.key] !== false
                      }
                      onChange={(e) =>
                        updateNestedConfig(
                          "objectionHandling",
                          objection.key,
                          e.target.checked
                        )
                      }
                      className="mr-3 mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {objection.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {objection.desc}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pl-6 p-3 bg-gray-50 rounded text-sm text-gray-700 border-l-4 border-blue-500">
                    <strong>Default response:</strong> "
                    {objection.defaultResponse}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Preview & Deploy
            </h2>
            <p className="text-gray-600">
              Review your AI agent configuration and deploy to your store
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-4">Agent Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Store:</span>{" "}
                  {agentConfig.storeName || "Not set"}
                </div>
                <div>
                  <span className="font-medium">Category:</span>{" "}
                  {agentConfig.storeCategory || "Not set"}
                </div>
                <div>
                  <span className="font-medium">Agent:</span>{" "}
                  {agentConfig.agentName || "Not set"}
                </div>
                <div>
                  <span className="font-medium">Language:</span>{" "}
                  {agentConfig.language || "en-US"}
                </div>
                <div>
                  <span className="font-medium">Voice:</span>{" "}
                  {voiceOptions.find((v) => v.id === agentConfig.voiceStyle)
                    ?.name || "Professional Female"}
                </div>
                <div>
                  <span className="font-medium">Discount:</span>{" "}
                  {agentConfig.discountCode
                    ? `${agentConfig.discountCode} (${agentConfig.discountPercentage}% off)`
                    : "None"}
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  Sample Call Preview
                </h4>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                <div className="flex items-center mb-2">
                  <FiVolume2 className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    AI Agent ({agentConfig.agentName || "Sarah"})
                  </span>
                </div>
                <p className="text-blue-800">
                  "Hi John, this is {agentConfig.agentName || "Sarah"} from{" "}
                  {agentConfig.storeName || "your store"}. I noticed you picked
                  out a Blue Cotton Shirt but didn't get to checkout yet. Is
                  this a good time to talk for a minute?"
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-xl p-8 text-white shadow-2xl">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">
                  🚀 Ready to Transform Your Sales!
                </h3>
                <p className="text-blue-100 text-lg">
                  Your AI agent will recover abandoned carts automatically
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                  <div className="text-3xl font-bold mb-1">15-25%</div>
                  <div className="text-sm text-blue-100">
                    Cart Recovery Rate
                  </div>
                  <div className="text-xs text-blue-200 mt-1">
                    Industry leading performance
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                  <div className="text-3xl font-bold mb-1">400%</div>
                  <div className="text-sm text-blue-100">Average ROI</div>
                  <div className="text-xs text-blue-200 mt-1">
                    Typical return on investment
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                  <div className="text-3xl font-bold mb-1">24/7</div>
                  <div className="text-sm text-blue-100">Always Active</div>
                  <div className="text-xs text-blue-200 mt-1">
                    Never miss an opportunity
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Skiddly AI Voice Agent Builder
            </h1>
            <p className="text-gray-600">
              Create intelligent voice agents to recover abandoned Shopify carts
            </p>
          </div>

          <div className="flex items-center justify-between mb-8 overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center min-w-max">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.id
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-600"
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="ml-3 text-sm font-medium text-gray-900">
                  {step.title}
                </div>
                {index < steps.length - 1 && (
                  <FiChevronRight className="w-5 h-5 text-gray-400 ml-6" />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            {renderStepContent()}
          </div>

          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-medium flex items-center ${
                currentStep === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <FiChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            <button
              onClick={currentStep === 6 ? handleDeploy : nextStep}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center"
            >
              {currentStep === 6 ? "Deploy Agent" : "Next Step"}
              <FiChevronRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopifyAIAgentBuilder;
