"use client";

import React, { useState } from "react";
import {
  FiPlay,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiSettings,
  FiBarChart2,
  FiPhone,
  FiUser,
  FiBox,
} from "react-icons/fi";
import TwilioConnectionModal from "@/components/TwilioConnectionModal";
import { useTwilio } from "@/hooks/useTwilio";
import toast from "react-hot-toast";

// Section Separator Component
const SectionSeparator = () => (
  <div className="border-t-2 border-dashed border-gray-200 my-8"></div>
);

const LaunchTestStep = ({ config, onUpdate,agentConfig, onSave, loading, errors = {} }) => {
  const [showTwilioModal, setShowTwilioModal] = useState(false);
  const { numbers, hasNumbers, updateNumbersAfterConnection } = useTwilio();
  // Find the selected phone number from the numbers array
  console.log(numbers)
  const selectedPhoneNumber =
    config?.connectedPhoneNumbers?.length > 0
      ? numbers.find((n) => n._id === config.connectedPhoneNumbers[0])
      : null;

  const handleChange = (field, value) => {
    onUpdate({ [field]: value });
  };

  const handleTwilioConnect = async (numberData) => {
    try {
      console.log("Twilio connected with number:", numberData);

      // Update the numbers after connection
      await updateNumbersAfterConnection();

      toast.success(
        `Twilio connected successfully! Number: ${numberData.phoneNumber}`
      );
    } catch (error) {
      console.error("Error connecting Twilio:", error);
      toast.error("Failed to connect Twilio. Please try again.");
    }
  };


  const handleNumberSelect = (number) => {
    // Update the config with the selected number ID in connectedPhoneNumbers array
    onUpdate({ connectedPhoneNumbers: number ? [number._id] : [] });
  };

  // Safety check for config
  if (!config) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Loading configuration...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "validated":
        return "text-green-600 bg-green-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-yellow-600 bg-yellow-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "validated":
        return FiCheckCircle;
      case "failed":
        return FiAlertTriangle;
      default:
        return FiClock;
    }
  };

  const getDeploymentStatusColor = (status) => {
    switch (status) {
      case "live":
        return "text-green-600 bg-green-100";
      case "testing":
        return "text-blue-600 bg-blue-100";
      case "paused":
        return "text-orange-600 bg-orange-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="space-y-8">
      {/* Test & Launch Header */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Test & launch
        </h2>
        <p className="text-sm text-gray-500">
          Test outbound flows and deploy live agent.
        </p>
      </div>

      {/* Agent Cards Section */}
      <div className="space-y-3">
        {/* First Agent Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <FiUser className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                  <h4 className="text-sm font-semibold text-gray-900">{agentConfig.agentName}</h4>
                <p className="text-xs text-gray-500">
                  {agentConfig.language}
                </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    <span className="text-xs text-gray-500">Abondoned Checkout agent</span>
                  </div>
              </div>
            </div>
            {!hasNumbers || numbers.length === 0 ? (
              <button
                onClick={() => setShowTwilioModal(true)}
                className="px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-xs font-medium"
              >
                Connect Phone
              </button>
            ) : (
              <div className="text-xs text-gray-500">
                {selectedPhoneNumber?.phoneNumber
                  ? selectedPhoneNumber.phoneNumber
                  : "Select number below"}
              </div>
            )}
          </div>
        </div>

        {/* Second Agent Card */}
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <FiUser className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{agentConfig.agentName}</h4>
               
               
              </div>
            </div>
            <button className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-xs font-medium">
              Test Agent
            </button>
          </div>
        </div>
      </div>

      {/* Connected Phone Numbers Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900">
          Connected phone numbers
        </h3>
        <p className="text-xs text-gray-500">
          Choose a phone number from the Agent so that your agent can call from
          connected to respective text.
        </p>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          {hasNumbers && numbers.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-900">
                <span className="font-medium">Available Numbers:</span>
              </div>
              <select
                value={selectedPhoneNumber?._id || ""}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const number = numbers.find((n) => n._id === selectedId);
                  handleNumberSelect(number);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
              >
                <option value="">Select a phone number</option>
                {numbers.map((number) => (
                  <option key={number._id} value={number._id}>
                    {number.phoneNumber} ({number.type})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No phone numbers connected
            </div>
          )}
        </div>
      </div>

      {/* Connected Knowledge Base Section - Disabled for now */}
      <div className="space-y-4 opacity-50 pointer-events-none">
        <h3 className="text-sm font-medium text-gray-900">
          Connected knowledge base
        </h3>
        <p className="text-xs text-gray-500">
          Choose a knowledge base from the Agent so that your agent can call
          from connected to respective text.
        </p>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-900">
              <span className="font-medium">Coming Soon...</span>
            </div>
            <button
              disabled
              className="px-3 py-1.5 bg-gray-100 border border-gray-300 text-gray-400 rounded-md cursor-not-allowed text-xs font-medium"
            >
              Create New
            </button>
          </div>
        </div>
      </div>

      {/* Policy Links Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              Refund policy
            </label>
            <input
              type="text"
              value={config.policyLinks?.refundPolicy || ""}
              onChange={(e) =>
                handleChange("policyLinks", {
                  ...config.policyLinks,
                  refundPolicy: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
              placeholder="Enter link here"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              Cancellation policy
            </label>
            <input
              type="text"
              value={config.policyLinks?.cancellationPolicy || ""}
              onChange={(e) =>
                handleChange("policyLinks", {
                  ...config.policyLinks,
                  cancellationPolicy: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
              placeholder="Enter link here"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              Shipping policy
            </label>
            <input
              type="text"
              value={config.policyLinks?.shippingPolicy || ""}
              onChange={(e) =>
                handleChange("policyLinks", {
                  ...config.policyLinks,
                  shippingPolicy: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
              placeholder="Enter link here"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              Terms and conditions
            </label>
            <input
              type="text"
              value={config.policyLinks?.termsAndConditions || ""}
              onChange={(e) =>
                handleChange("policyLinks", {
                  ...config.policyLinks,
                  termsAndConditions: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
              placeholder="Enter link here"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              Warranty
            </label>
            <input
              type="text"
              value={config.policyLinks?.warranty || ""}
              onChange={(e) =>
                handleChange("policyLinks", {
                  ...config.policyLinks,
                  warranty: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
              placeholder="Enter link here"
            />
          </div>
        </div>
      </div>

      {/* Twilio Connect Modal */}
      <TwilioConnectionModal
        isOpen={showTwilioModal}
        onClose={() => setShowTwilioModal(false)}
        onConnect={handleTwilioConnect}
      />
    </div>
  );
};

export default LaunchTestStep;
