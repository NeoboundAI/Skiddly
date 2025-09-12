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
  FiRotateCcw,
} from "react-icons/fi";

const ObjectionHandlingStep = ({ config, onUpdate, errors = {} }) => {
  const handleChange = (field, value) => {
    onUpdate({ [field]: value });
  };

  const objectionTypes = [
    {
      id: "Shipping Cost Concern",
      name: "Shipping Cost Concerns",
      icon: FiTruck,
    },
    {
      id: "Price Concern",
      name: "Price of objections",
      icon: FiDollarSign,
    },
    {
      id: "Payment Issue",
      name: "Payment concerns",
      icon: FiCreditCard,
    },
    {
      id: "Technical Issues",
      name: "Technical issues",
      icon: FiTool,
    },
    {
      id: "Size/Fit Doubts (for fashion/apparel)",
      name: "Size/Fit Concerns",
      icon: FiMaximize2,
    },
    {
      id: "Comparison Shopping",
      name: "Comparison Shopping",
      icon: FiBarChart2,
    },
    {
      id: "Just Forgot / Got Busy",
      name: "Forgot to Complete",
      icon: FiHelpCircle,
    },
    {
      id: "Product Questions/Uncertainty",
      name: "Product Questions/Uncertainty",
      icon: FiMessageSquare,
    },
    {
      id: "Wrong Item/Changed Mind",
      name: "Wrong Item/Changed Mind",
      icon: FiHelpCircle,
    },
  ];

  const handleObjectionToggle = (objectionId) => {
    const currentData = config[objectionId] || {};
    handleChange(objectionId, {
      ...currentData,
      enabled: !currentData.enabled,
    });
  };

  const handleCustomToggle = (objectionId) => {
    const currentData = config[objectionId] || {};
    handleChange(objectionId, {
      ...currentData,
      customEnabled: !currentData.customEnabled,
      defaultEnabled: currentData.customEnabled,
    });
  };

  const handleCustomTextChange = (objectionId, value) => {
    const currentData = config[objectionId] || {};
    handleChange(objectionId, {
      ...currentData,
      custom: value,
    });
  };

  const resetToDefault = (objectionId) => {
    const currentData = config[objectionId] || {};
    handleChange(objectionId, {
      ...currentData,
      customEnabled: false,
      defaultEnabled: true,
      custom: "",
    });
  };

  return (
    <div className="space-y-8">
      {/* Objection Handling Header */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          Objection Handling
        </h2>
        <p className="text-xs text-gray-600">
          Preloaded and customizable objection responses for common shopper
          hesitations
        </p>
      </div>

      <div className="space-y-4">
       

        <div className="space-y-3">
          {objectionTypes.map((type) => {
            const Icon = type.icon;
            const objectionData = config[type.id] || {};
            const isEnabled = objectionData.enabled || false;
            const isCustomEnabled = objectionData.customEnabled || false;
            const isDefaultEnabled = objectionData.defaultEnabled || false;
            const defaultResponse = objectionData.default || "";
            const customResponse = objectionData.custom || "";

            return (
              <div
                key={type.id}
                className={`rounded-lg border-2 p-3 transition-all ${
                  isEnabled
                    ? "bg-purple-50 border-purple-400"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-3 h-3 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {type.name}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {objectionData.subtitle ||
                          "Configure response for this objection type"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleObjectionToggle(type.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      isEnabled ? "bg-purple-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        isEnabled ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {isEnabled && (
                  <div className="mt-3 space-y-3">
                    {/* Response Type Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-1">
                          <input
                            type="radio"
                            name={`response-${type.id}`}
                            checked={isDefaultEnabled}
                            onChange={() => {
                              if (!isDefaultEnabled) {
                                handleChange(type.id, {
                                  ...objectionData,
                                  defaultEnabled: true,
                                  customEnabled: false,
                                });
                              }
                            }}
                            className="w-3 h-3 text-purple-600"
                          />
                          <span className="text-xs font-medium text-gray-700">
                            Default Response
                          </span>
                        </label>
                        <label className="flex items-center space-x-1">
                          <input
                            type="radio"
                            name={`response-${type.id}`}
                            checked={isCustomEnabled}
                            onChange={() => {
                              if (!isCustomEnabled) {
                                handleChange(type.id, {
                                  ...objectionData,
                                  customEnabled: true,
                                  defaultEnabled: false,
                                });
                              }
                            }}
                            className="w-3 h-3 text-purple-600"
                          />
                          <span className="text-xs font-medium text-gray-700">
                            Custom Response
                          </span>
                        </label>
                      </div>
                      {isCustomEnabled && (
                        <button
                          onClick={() => resetToDefault(type.id)}
                          className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
                        >
                          <FiRotateCcw className="w-3 h-3" />
                          <span>Reset to Default</span>
                        </button>
                      )}
                    </div>

                    {/* Response Content */}
                    <div>
                      {isDefaultEnabled ? (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-700 font-medium mb-1">
                            Default Response:
                          </p>
                          <p className="text-xs text-gray-600 italic">
                            "{defaultResponse}"
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Custom Response
                          </label>
                          <textarea
                            value={customResponse}
                            onChange={(e) =>
                              handleCustomTextChange(type.id, e.target.value)
                            }
                            rows={3}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                            placeholder="Enter your custom response here..."
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Default: "{defaultResponse}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ObjectionHandlingStep;
