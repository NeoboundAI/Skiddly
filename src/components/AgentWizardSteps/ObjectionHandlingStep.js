"use client";

import React from "react";
import {
  FiMessageSquare,
  FiTruck,
  FiDollarSign,
  FiMaximize2,
  FiCreditCard,
  FiTool,
  FiBarChart2,
  FiHelpCircle,
} from "react-icons/fi";

const ObjectionHandlingStep = ({ config, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate({ [field]: value });
  };

  const objectionTypes = [
    {
      id: "shipping",
      name: "Shipping Concerns",
      icon: FiTruck,
      description: "Address shipping time, cost, and tracking concerns",
      defaultResponse: "We offer fast and reliable shipping with tracking.",
    },
    {
      id: "price",
      name: "Price Concerns",
      icon: FiDollarSign,
      description: "Handle pricing questions and offer discounts",
      defaultResponse:
        "We have competitive pricing and often run special promotions.",
    },
    {
      id: "size",
      name: "Size/Fit Issues",
      icon: FiMaximize2,
      description: "Address sizing concerns and return policies",
      defaultResponse:
        "We offer a wide range of sizes and easy returns if needed.",
    },
    {
      id: "payment",
      name: "Payment Security",
      icon: FiCreditCard,
      description: "Assure customers about payment security",
      defaultResponse:
        "We accept all major credit cards and offer secure checkout.",
    },
    {
      id: "technical",
      name: "Technical Issues",
      icon: FiTool,
      description: "Handle website or checkout problems",
      defaultResponse:
        "Our customer support team is here to help with any issues.",
    },
    {
      id: "comparison",
      name: "Competitor Comparison",
      icon: FiBarChart2,
      description: "Address comparisons with other stores",
      defaultResponse:
        "We're confident you'll find our quality and service exceptional.",
    },
    {
      id: "forgot",
      name: "Forgot About Cart",
      icon: FiHelpCircle,
      description: "Handle customers who forgot they had items",
      defaultResponse:
        "No problem! I can help you complete your purchase quickly.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      <div className="text-center mb-3">
        <h2 className="text-base font-bold text-gray-900 mb-0.5">
          Objection Handling
        </h2>
        <p className="text-[11px] text-gray-600">
          Preloaded and customizable responses to common shopper hesitations or objections
        </p>
      </div>

      <div className="space-y-4">
        {objectionTypes.map((type) => {
          const Icon = type.icon;
          const isEnabled = config[type.id];
          const response = config[`${type.id}Response`];

          return (
            <div
              key={type.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {type.name}
                    </h3>
                    <p className="text-xs text-gray-600">{type.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleChange(type.id, !isEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isEnabled ? "bg-purple-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      isEnabled ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {isEnabled && (
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Custom Response
                  </label>
                  <textarea
                    value={response}
                    onChange={(e) =>
                      handleChange(`${type.id}Response`, e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                    placeholder={type.defaultResponse}
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Leave empty to use default response: "{type.defaultResponse}"
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Section */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mt-2">
        <h3 className="text-base font-semibold text-blue-900 mb-3 flex items-center">
          <FiMessageSquare className="w-4 h-4 mr-2" />
          Objection Handling Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {objectionTypes.map((type) => (
            <div key={type.id} className="text-center">
              <div
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center ${
                  config[type.id] ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                {config[type.id] ? (
                  <div className="w-2.5 h-2.5 bg-green-600 rounded-full"></div>
                ) : (
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">{type.name}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-blue-700 mt-3">
          <strong>Tip:</strong> Enable the objection types you want your agent to handle. You can customize responses for each type or use the default responses.
        </p>
      </div>
    </div>
  );
};

export default ObjectionHandlingStep;
