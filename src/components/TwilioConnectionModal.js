"use client";

import { useState, useEffect } from "react";
import {
  FiX,
  FiHelpCircle,
  FiExternalLink,
  FiArrowRight,
} from "react-icons/fi";

const TwilioConnectionModal = ({ isOpen, onClose, onConnect }) => {
  const [step, setStep] = useState("selection"); // "selection", "own", "free"
  const [isLoading, setIsLoading] = useState(false);
  const [freeNumbers, setFreeNumbers] = useState([]);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [formData, setFormData] = useState({
    sid: "",
    token: "",
    phoneNumber: "",
  });

  useEffect(() => {
    if (isOpen && step === "free") {
      fetchFreeNumbers();
    }
  }, [isOpen, step]);

  const fetchFreeNumbers = async () => {
    try {
      const response = await fetch("/api/twilio/free-numbers");
      const data = await response.json();
      if (data.success) {
        setFreeNumbers(data.numbers);
      }
    } catch (error) {
      console.error("Error fetching free numbers:", error);
    }
  };

  const handleOwnNumberSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/twilio/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onConnect(data.number);
        onClose();
      } else {
        alert(data.message || "Failed to connect Twilio number");
      }
    } catch (error) {
      console.error("Error connecting Twilio:", error);
      alert("Failed to connect Twilio number");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFreeNumberSubmit = async () => {
    if (!selectedNumber) {
      alert("Please select a number");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/twilio/assign-free-number", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: selectedNumber.phoneNumber,
          sid: selectedNumber.sid,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onConnect(data.number);
        onClose();
      } else {
        alert(data.message || "Failed to assign free number");
      }
    } catch (error) {
      console.error("Error assigning free number:", error);
      alert("Failed to assign free number");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img
              src="/twilio.svg"
              alt="Twilio"
              className="w-8 h-8"
            />
            <h2 className="text-xl font-semibold text-gray-900">
              Connect Twilio
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              How to Connect
              <FiHelpCircle className="w-4 h-4" />
            </a>
            <a
              href="https://twilio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              Twilio.com
              <FiExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "selection" ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Choose your Twilio connection method
                </h3>
                <p className="text-sm text-gray-600">
                  Select how you'd like to connect your Twilio number
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setStep("own")}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Add Your Own Twilio Number
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Connect your existing Twilio account and phone number
                      </p>
                    </div>
                    <FiArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>

                <button
                  onClick={() => setStep("free")}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Get Free Test Number
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Use our free test number (limited to 10 calls)
                      </p>
                    </div>
                    <FiArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              </div>
            </div>
          ) : step === "own" ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setStep("selection")}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ← Back to selection
                </button>
              </div>

              <form onSubmit={handleOwnNumberSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account SID
                  </label>
                  <input
                    type="text"
                    placeholder="Eg. AC1234567890abcdef"
                    value={formData.sid}
                    onChange={(e) =>
                      setFormData({ ...formData, sid: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auth Token
                  </label>
                  <input
                    type="password"
                    placeholder="Eg. 1234567890abcdef"
                    value={formData.token}
                    onChange={(e) =>
                      setFormData({ ...formData, token: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="Eg. +1234567890"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setStep("selection")}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ← Back to selection
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-800">
                    Select a free test number from our available pool. These
                    numbers are limited to 10 calls for testing purposes.
                  </p>
                </div>

                {freeNumbers.length > 0 ? (
                  <div className="space-y-3">
                    {freeNumbers.map((number) => (
                      <div
                        key={number.sid}
                        onClick={() => setSelectedNumber(number)}
                        className={`p-4 border rounded-md cursor-pointer transition-colors ${
                          selectedNumber?.sid === number.sid
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {number.friendlyName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {number.phoneNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Free Test</p>
                            <p className="text-xs text-gray-500">
                              Max 10 calls
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      Loading available numbers...
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="bg-slate-100 p-6">
          {step === "selection" ? (
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-4">
                Choose an option above to continue
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-gray-600 text-sm font-medium">
                  Don't have an account?
                </span>
                <button
                  disabled
                  className="bg-white border border-gray-300 text-gray-500 px-3 py-1.5 rounded-md text-sm font-medium cursor-not-allowed"
                >
                  Purchase Twilio Number (Coming Soon)
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={
                  step === "own"
                    ? handleOwnNumberSubmit
                    : handleFreeNumberSubmit
                }
                disabled={
                  step === "own"
                    ? isLoading ||
                      !formData.sid ||
                      !formData.token ||
                      !formData.phoneNumber
                    : isLoading || !selectedNumber
                }
                className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {step === "own" ? "Connecting..." : "Assigning..."}
                  </>
                ) : (
                  <>
                    {step === "own" ? "Connect" : "Assign Number"}
                    <FiArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm font-medium">
                  Don't have an account?
                </span>
                <button
                  disabled
                  className="bg-white border border-gray-300 text-gray-500 px-3 py-1.5 rounded-md text-sm font-medium cursor-not-allowed"
                >
                  Purchase Twilio Number (Coming Soon)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwilioConnectionModal;
