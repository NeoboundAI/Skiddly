"use client";

import type React from "react";
import { useState } from "react";
import PurchaseList from "./PurchaseList";

interface TwilioImportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (credentials: TwilioCredentials) => void;
}

interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

const TwilioImportForm: React.FC<TwilioImportFormProps> = ({
  isOpen,
  onClose,
  onConnect,
}) => {
  const [credentials, setCredentials] = useState<TwilioCredentials>({
    accountSid: "",
    authToken: "",
    phoneNumber: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPurchaseList, setShowPurchaseList] = useState(false);

  const handleInputChange = (field: keyof TwilioCredentials, value: string) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !credentials.accountSid ||
      !credentials.authToken ||
      !credentials.phoneNumber
    ) {
      return;
    }

    setIsLoading(true);

    try {
      // Call the onConnect callback with credentials
      await onConnect(credentials);
      onClose();

      // Reset form
      setCredentials({
        accountSid: "",
        authToken: "",
        phoneNumber: "",
      });
    } catch (error) {
      console.error("Failed to connect Twilio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = () => {
    setShowPurchaseList(true);
  };

  const handlePurchaseSuccess = (phoneNumber: string) => {
    // Auto-fill the phone number in the form and mark as connected
    setCredentials((prev) => ({
      ...prev,
      phoneNumber,
    }));

    // Since the number was purchased and connected, we can close the form
    // and trigger the connection with minimal required info
    onConnect({
      accountSid: "purchased", // This will be handled differently in the backend
      authToken: "purchased", // This will be handled differently in the backend
      phoneNumber,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid"
              viewBox="0 0 256 256"
            >
              <path
                fill="#F12E45"
                d="M128 0c70.656 0 128 57.344 128 128s-57.344 128-128 128S0 198.656 0 128 57.344 0 128 0Zm0 33.792c-52.224 0-94.208 41.984-94.208 94.208S75.776 222.208 128 222.208s94.208-41.984 94.208-94.208S180.224 33.792 128 33.792Zm31.744 99.328c14.704 0 26.624 11.92 26.624 26.624 0 14.704-11.92 26.624-26.624 26.624-14.704 0-26.624-11.92-26.624-26.624 0-14.704 11.92-26.624 26.624-26.624Zm-63.488 0c14.704 0 26.624 11.92 26.624 26.624 0 14.704-11.92 26.624-26.624 26.624-14.704 0-26.624-11.92-26.624-26.624 0-14.704 11.92-26.624 26.624-26.624Zm63.488-63.488c14.704 0 26.624 11.92 26.624 26.624 0 14.704-11.92 26.624-26.624 26.624-14.704 0-26.624-11.92-26.624-26.624 0-14.704 11.92-26.624 26.624-26.624Zm-63.488 0c14.704 0 26.624 11.92 26.624 26.624 0 14.704-11.92 26.624-26.624 26.624-14.704 0-26.624-11.92-26.624-26.624 0-14.704 11.92-26.624 26.624-26.624Z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">
              Connect Twilio
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://help.twilio.com/articles/14726256820123-What-is-a-Twilio-Account-SID-and-where-can-I-find-it-"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              How to Connect
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </a>
            <a
              href="https://www.twilio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              Twilio.com
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="">
          <div className="p-6 space-y-6">
            {/* Account SID */}
            <div className="max-w-md">
              <label
                htmlFor="accountSid"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Account SID
              </label>
              <input
                type="text"
                id="accountSid"
                placeholder="Eg. ad3232_2323"
                value={credentials.accountSid}
                onChange={(e) =>
                  handleInputChange("accountSid", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Auth Token */}
            <div className="max-w-md">
              <label
                htmlFor="authToken"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Auth Token
              </label>
              <input
                type="password"
                id="authToken"
                placeholder="Eg. ad3232_2323"
                value={credentials.authToken}
                onChange={(e) => handleInputChange("authToken", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Phone Number */}
            <div className="max-w-md">
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                placeholder="Eg. ad3232_2323"
                value={credentials.phoneNumber}
                onChange={(e) =>
                  handleInputChange("phoneNumber", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="bg-slate-100 flex items-center justify-between p-6">
            <button
              type="submit"
              disabled={
                isLoading ||
                !credentials.accountSid ||
                !credentials.authToken ||
                !credentials.phoneNumber
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
                  Connecting...
                </>
              ) : (
                <>
                  Connect
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm font-medium">
                Don't have an account
              </span>
              <button
                type="button"
                onClick={handleCreateAccount}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                Purchase Twilio Number
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Purchase List Modal */}
      <PurchaseList
        isOpen={showPurchaseList}
        onClose={() => setShowPurchaseList(false)}
        onPurchaseSuccess={handlePurchaseSuccess}
      />
    </div>
  );
};

export default TwilioImportForm;
