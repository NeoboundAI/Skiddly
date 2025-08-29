"use client";

import React from "react";
import { FiPhone, FiPlus, FiX, FiClock, FiCalendar } from "react-icons/fi";

const CallLogicStep = ({ config, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate({ [field]: value });
  };

  const addCondition = () => {
    const newCondition = {
      type: "cart-value",
      operator: ">=",
      value: "",
      enabled: true,
    };
    const newConditions = [...(config.conditions || []), newCondition];
    handleChange("conditions", newConditions);
  };

  const updateCondition = (index, field, value) => {
    const newConditions = [...(config.conditions || [])];
    newConditions[index] = { ...newConditions[index], [field]: value };
    handleChange("conditions", newConditions);
  };

  const removeCondition = (index) => {
    const newConditions = (config.conditions || []).filter(
      (_, i) => i !== index
    );
    handleChange("conditions", newConditions);
  };

  const toggleCondition = (index) => {
    const newConditions = [...(config.conditions || [])];
    newConditions[index] = {
      ...newConditions[index],
      enabled: !newConditions[index].enabled,
    };
    handleChange("conditions", newConditions);
  };

  const conditionTypes = [
    {
      id: "cart-value",
      name: "Cart Value",
      operators: [">=", "<=", "==", "!="],
    },
    { id: "products", name: "Products", operators: ["includes", "excludes"] },
    { id: "customer-type", name: "Customer Type", operators: ["is", "is not"] },
    {
      id: "previous-orders",
      name: "Previous Orders",
      operators: [">=", "<=", "=="],
    },
    { id: "location", name: "Location", operators: ["is", "is not"] },
    { id: "coupon-code", name: "Coupon Code", operators: ["is", "is not"] },
    {
      id: "payment-method",
      name: "Payment Method",
      operators: ["is", "is not"],
    },
  ];

  const getConditionColor = (index) => {
    const colors = [
      "bg-green-50",
      "bg-orange-50",
      "bg-purple-50",
      "bg-blue-50",
      "bg-red-50",
      "bg-pink-50",
      "bg-indigo-50",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-base font-bold text-gray-900 mb-1">Call Logic</h2>
        <p className="text-[10px] text-gray-600">
          Set up wait times, call conditions, call schedules, retries, weekend
          behavior, and voicemail handling
        </p>
      </div>

      {/* Call Conditions Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
          <FiPhone className="w-4 h-4 mr-2" />
          Call Conditions
        </h3>
        <p className="text-xs text-gray-600 mb-4">
          Define conditions that must be met for calls to be made (AND logic)
        </p>

        <div className="space-y-3">
          {(config.conditions || []).map((condition, index) => {
            const conditionType = conditionTypes.find(
              (t) => t.id === condition.type
            );
            return (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getConditionColor(index)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-xs text-gray-900">
                    Condition {index + 1}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleCondition(index)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        condition.enabled ? "bg-green-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          condition.enabled ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => removeCondition(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={condition.type}
                      onChange={(e) =>
                        updateCondition(index, "type", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                    >
                      {conditionTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Operator
                    </label>
                    <select
                      value={condition.operator}
                      onChange={(e) =>
                        updateCondition(index, "operator", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                    >
                      {conditionType?.operators.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) =>
                        updateCondition(index, "value", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                      placeholder={
                        condition.type === "cart-value" ? "50" : "Enter value"
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={addCondition}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors flex items-center justify-center space-x-2 text-xs text-gray-600 hover:text-purple-600"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add New Condition</span>
          </button>
        </div>
      </div>

      {/* Call Schedule Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
          <FiClock className="w-5 h-5 mr-2" />
          Call Schedule
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Wait Time
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={config.callSchedule?.waitTime}
                onChange={(e) =>
                  handleChange("callSchedule", {
                    ...config.callSchedule,
                    waitTime: e.target.value,
                  })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                placeholder="2"
              />
              <select
                value={config.callSchedule?.waitTimeUnit}
                onChange={(e) =>
                  handleChange("callSchedule", {
                    ...config.callSchedule,
                    waitTimeUnit: e.target.value,
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Max Retries
            </label>
            <input
              type="number"
              value={config.callSchedule?.maxRetries}
              onChange={(e) =>
                handleChange("callSchedule", {
                  ...config.callSchedule,
                  maxRetries: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              placeholder="3"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Retry Interval
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={config.callSchedule?.retryInterval}
                onChange={(e) =>
                  handleChange("callSchedule", {
                    ...config.callSchedule,
                    retryInterval: e.target.value,
                  })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                placeholder="24"
              />
              <select
                value={config.callSchedule?.retryIntervalUnit}
                onChange={(e) =>
                  handleChange("callSchedule", {
                    ...config.callSchedule,
                    retryIntervalUnit: e.target.value,
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              >
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Call Time Start
            </label>
            <input
              type="time"
              value={config.callSchedule?.callTimeStart}
              onChange={(e) =>
                handleChange("callSchedule", {
                  ...config.callSchedule,
                  callTimeStart: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Call Time End
            </label>
            <input
              type="time"
              value={config.callSchedule?.callTimeEnd}
              onChange={(e) =>
                handleChange("callSchedule", {
                  ...config.callSchedule,
                  callTimeEnd: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Timezone
            </label>
            <select
              value={config.callSchedule?.timezone}
              onChange={(e) =>
                handleChange("callSchedule", {
                  ...config.callSchedule,
                  timezone: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-xs text-gray-900">Weekend Calling</h4>
              <p className="text-[10px] text-gray-600">Allow calls on weekends</p>
            </div>
            <button
              onClick={() =>
                handleChange("callSchedule", {
                  ...config.callSchedule,
                  weekendCalling: !config.callSchedule?.weekendCalling,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.callSchedule?.weekendCalling
                  ? "bg-purple-600"
                  : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.callSchedule?.weekendCalling
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-xs text-gray-900">Respect DND</h4>
              <p className="text-[10px] text-gray-600">
                Respect Do Not Disturb settings
              </p>
            </div>
            <button
              onClick={() =>
                handleChange("callSchedule", {
                  ...config.callSchedule,
                  respectDND: !config.callSchedule?.respectDND,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.callSchedule?.respectDND
                  ? "bg-purple-600"
                  : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.callSchedule?.respectDND
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-xs text-gray-900">Voicemail Detection</h4>
              <p className="text-[10px] text-gray-600">
                Detect and handle voicemail
              </p>
            </div>
            <button
              onClick={() =>
                handleChange("callSchedule", {
                  ...config.callSchedule,
                  voicemailDetection: !config.callSchedule?.voicemailDetection,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.callSchedule?.voicemailDetection
                  ? "bg-purple-600"
                  : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.callSchedule?.voicemailDetection
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallLogicStep;
