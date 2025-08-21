"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const PlanSelector = ({ onPlanSelect, isLoading }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState("free");

  const plans = [
    {
      id: "free",
      name: "Free Plan",
      price: 0,
      credits: 10,
      features: [
        { name: "Total Credits (Outbound Calls)", value: "10", included: true },
        { name: "Agent Creation", value: "1", included: true },
        { name: "Agent Configuration Settings", value: "Yes", included: true },
        { name: "Twilio Integration", value: "Yes", included: true },
        { name: "Data Retention", value: "30 days", included: true },
        { name: "Monthly Active Users", value: "4", included: true },
        { name: "Campaign Management", value: "Basic", included: true },
      ],
      gradient: "from-purple-100 to-purple-200",
      textColor: "text-gray-800",
      buttonColor: "bg-gray-800 hover:bg-gray-900",
      enabled: true,
    },
    {
      id: "infrasonic",
      name: "Infrasonic",
      price: 1223,
      credits: 100,
      features: [
        {
          name: "Total Credits (Outbound Calls)",
          value: "100",
          included: true,
        },
        { name: "Agent Creation", value: "5", included: true },
        {
          name: "Agent Configuration Settings",
          value: "Advanced",
          included: true,
        },
        { name: "Twilio Integration", value: "Yes", included: true },
        { name: "Data Retention", value: "90 days", included: true },
        { name: "Monthly Active Users", value: "25", included: true },
        { name: "Campaign Management", value: "Advanced", included: true },
        { name: "Priority Support", value: "Yes", included: true },
      ],
      gradient: "from-gray-900 via-green-900 to-blue-900",
      textColor: "text-white",
      buttonColor: "bg-gray-600 hover:bg-gray-700",
      enabled: false,
      comingSoon: true,
    },
    {
      id: "ultrasonic",
      name: "Ultrasonic",
      price: 1894,
      credits: 500,
      features: [
        {
          name: "Total Credits (Outbound Calls)",
          value: "500",
          included: true,
        },
        { name: "Agent Creation", value: "Unlimited", included: true },
        {
          name: "Agent Configuration Settings",
          value: "Premium",
          included: true,
        },
        { name: "Twilio Integration", value: "Yes", included: true },
        { name: "Data Retention", value: "365 days", included: true },
        { name: "Monthly Active Users", value: "100", included: true },
        { name: "Campaign Management", value: "Enterprise", included: true },
        { name: "Priority Support", value: "24/7", included: true },
        { name: "Custom Integrations", value: "Yes", included: true },
      ],
      gradient: "from-purple-900 via-purple-800 to-purple-700",
      textColor: "text-white",
      buttonColor: "bg-gray-600 hover:bg-gray-700",
      enabled: false,
      comingSoon: true,
    },
  ];

  const handlePlanSelect = (planId) => {
    if (plans.find((p) => p.id === planId).enabled) {
      setSelectedPlan(planId);
      onPlanSelect(planId);
    }
  };

  const getPrice = (basePrice) => {
    if (basePrice === 0) return "$0";

    const discounts = {
      monthly: 0,
      quarterly: 0.1,
      annually: 0.2,
    };

    const discount = discounts[selectedPeriod];
    const finalPrice = basePrice * (1 - discount);

    return `$${Math.round(finalPrice).toLocaleString()} incl taxes`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-purple-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Choose a Plan
          </h1>
          <p className="text-base text-gray-600">
            Select a plan to continue to the Skiddly platform
          </p>
        </motion.div>

        {/* Pricing Period Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg p-1 shadow-md">
            {["monthly", "quarterly", "annually"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  selectedPeriod === period
                    ? "bg-gray-800 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
                {period === "quarterly" && (
                  <span className="ml-1 text-xs text-green-600">-10%</span>
                )}
                {period === "annually" && (
                  <span className="ml-1 text-xs text-green-600">-20%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-lg overflow-hidden shadow-lg ${
                selectedPlan === plan.id ? "ring-2 ring-purple-500" : ""
              }`}
            >
              <div
                className={`bg-gradient-to-br ${plan.gradient} p-4 ${plan.textColor} flex flex-col h-full`}
              >
                <div className="text-center flex-1">
                  <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
                  <div className="text-2xl font-bold mb-3">
                    {getPrice(plan.price)}
                  </div>

                  {plan.comingSoon && (
                    <div className="bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium mb-3 inline-block">
                      Coming Soon
                    </div>
                  )}
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={!plan.enabled || isLoading}
                    className={`w-full py-2.5 cursor-pointer px-4 rounded-lg font-medium transition-all text-sm ${
                      plan.enabled
                        ? plan.buttonColor + " text-white"
                        : "bg-gray-400 text-gray-200 cursor-not-allowed"
                    }`}
                  >
                    {isLoading && selectedPlan === plan.id
                      ? "Processing..."
                      : plan.comingSoon
                      ? "Coming Soon"
                      : "Continue"}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                    Features
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      className="px-4 py-3 text-center text-sm font-medium text-gray-900"
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {plans[0].features.map((feature, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {feature.name}
                    </td>
                    {plans.map((plan) => {
                      const planFeature = plan.features[index];
                      return (
                        <td
                          key={plan.id}
                          className="px-4 py-3 text-center text-sm text-gray-600"
                        >
                          {planFeature ? (
                            planFeature.included ? (
                              <span className="text-green-600 font-medium">
                                {planFeature.value}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlanSelector;
