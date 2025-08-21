"use client";

import { useState, useEffect } from "react";

const PurchaseList = ({ isOpen, onClose, onPurchaseSuccess }) => {
  const [numbers, setNumbers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [purchasingNumber, setPurchasingNumber] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableNumbers();
    }
  }, [isOpen]);

  const fetchAvailableNumbers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/twilio/purchase");
      if (!response.ok) {
        throw new Error("Failed to fetch available numbers");
      }
      const data = await response.json();
      setNumbers(data);
    } catch (err) {
      setError("Failed to load available numbers. Please try again.");
      console.error("Error fetching numbers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (phoneNumber) => {
    setPurchasingNumber(phoneNumber);
    setError(null);

    onPurchaseSuccess(phoneNumber);
    onClose();

    try {
      // const response = await fetch("/api/twilio/purchase", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ phoneNumber }),
      // });

      // if (!response.ok) {
      //   throw new Error("Failed to purchase number");
      // }

      // const result = await response.json();
      onPurchaseSuccess(phoneNumber);
      onClose();
    } catch (err) {
      setError("Failed to purchase number. Please try again.");
      console.error("Error purchasing number:", err);
    } finally {
      setPurchasingNumber(null);
    }
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
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Purchase Twilio Number
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose a phone number to purchase and connect
              </p>
            </div>
          </div>
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

        {/* Pricing Info */}
        <div className="bg-blue-50 border-b border-blue-100 p-4">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm">
              <span className="font-medium text-blue-900">Pricing: </span>
              <span className="text-blue-800">
                You'll be charged $1.15 immediately. Afterwards, you'll be
                charged $1.15/month in addition to the usage you incur on the
                phone number.
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-red-800 text-sm font-medium">
                  {error}
                </span>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 animate-spin text-blue-600"
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
                <span className="text-gray-600">
                  Loading available numbers...
                </span>
              </div>
            </div>
          ) : numbers.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-gray-600 mb-4">No phone numbers available</p>
              <button
                onClick={fetchAvailableNumbers}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Refresh List
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-4">
                {numbers.length} phone numbers available
              </div>

              <div className="max-h-96 overflow-y-auto space-y-3">
                {numbers.map((number) => (
                  <div
                    key={number.phoneNumber}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-semibold text-gray-900">
                            {number.phoneNumber}
                          </span>
                          {number.locality && (
                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {number.locality}, {number.region}
                            </span>
                          )}
                        </div>
                        {number.rateCenter && (
                          <div className="text-sm text-gray-600">
                            Rate Center: {number.rateCenter}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handlePurchase(number.phoneNumber)}
                        disabled={purchasingNumber === number.phoneNumber}
                        className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 min-w-[100px] justify-center"
                      >
                        {purchasingNumber === number.phoneNumber ? (
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
                            Buying...
                          </>
                        ) : (
                          "Connect"
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseList;
