"use client";

import React from "react";
import { FiCreditCard } from "react-icons/fi";

const CommerceSettingsStep = ({ config, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate({ [field]: value });
  };

  const toggleExpressProvider = (provider) => {
    const currentProviders = config.expressProviders || [];
    const newProviders = currentProviders.includes(provider)
      ? currentProviders.filter((p) => p !== provider)
      : [...currentProviders, provider];
    handleChange("expressProviders", newProviders);
  };

  const toggleDiscountType = (type) => {
    const currentTypes = config.discountTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    handleChange("discountTypes", newTypes);
  };

  const expressProviders = [
    { id: "shop-pay", name: "Shop Pay", color: "bg-blue-100 text-blue-800" },
    { id: "paypal", name: "PayPal", color: "bg-blue-100 text-blue-800" },
    {
      id: "google-pay",
      name: "Google Pay",
      color: "bg-blue-100 text-blue-800",
    },
    { id: "apple-pay", name: "Apple Pay", color: "bg-blue-100 text-blue-800" },
    {
      id: "amazon-pay",
      name: "Amazon Pay",
      color: "bg-blue-100 text-blue-800",
    },
    { id: "meta-pay", name: "Meta Pay", color: "bg-blue-100 text-blue-800" },
    { id: "venmo", name: "Venmo", color: "bg-gray-100 text-gray-800" },
    { id: "klarna", name: "Klarna", color: "bg-gray-100 text-gray-800" },
  ];

  const discountTypes = [
    { id: "military", name: "Military", color: "bg-blue-100 text-blue-800" },
    { id: "student", name: "Student", color: "bg-blue-100 text-blue-800" },
    {
      id: "first-responder",
      name: "First Responder",
      color: "bg-blue-100 text-blue-800",
    },
    {
      id: "newsletter",
      name: "Newsletter",
      color: "bg-blue-100 text-blue-800",
    },
    { id: "referral", name: "Referral", color: "bg-blue-100 text-blue-800" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      <div className="text-center mb-3">
        <h2 className="text-base font-bold text-gray-900 mb-0.5">
          Express & Payments
        </h2>
        <p className="text-xs text-gray-600">
          Select what the store supports. Device/browser may affect visibility at runtime.
        </p>
      </div>

      {/* Express Providers Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
          <FiCreditCard className="w-3.5 h-3.5 mr-2" />
          Express Providers
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {expressProviders.map((provider) => {
            const isSelected = config.expressProviders?.includes(provider.id);
            return (
              <button
                key={provider.id}
                onClick={() => toggleExpressProvider(provider.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {provider.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Payments Accepted Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Payments Accepted <span className="font-normal text-gray-500">(comma separated)</span>
        </h3>
        <input
          type="text"
          value={config.paymentsAccepted}
          onChange={(e) => handleChange("paymentsAccepted", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
          placeholder="e.g., Visa, Mastercard, Amex"
        />
      </div>

      {/* BNPL Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          BNPL <span className="font-normal text-gray-500">(comma separated)</span>
        </h3>
        <input
          type="text"
          value={config.bnplProviders}
          onChange={(e) => handleChange("bnplProviders", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
          placeholder="e.g., Klarna, Afterpay"
        />
      </div>

      {/* Guest Checkout Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Guest checkout enabled
            </h3>
            <p className="text-xs text-gray-600">
              Allow customers to checkout without creating an account
            </p>
          </div>
          <button
            onClick={() =>
              handleChange("guestCheckoutEnabled", !config.guestCheckoutEnabled)
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.guestCheckoutEnabled ? "bg-purple-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.guestCheckoutEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Discounts & Notes Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Discounts & Notes
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              Discount Notes
            </label>
            <textarea
              value={config.discountsNotes}
              onChange={(e) => handleChange("discountsNotes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              placeholder="e.g., Student verified via SheerID."
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-2">
              Discount Types
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {discountTypes.map((type) => {
                const isSelected = config.discountTypes?.includes(type.id);
                return (
                  <button
                    key={type.id}
                    onClick={() => toggleDiscountType(type.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {type.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Notes Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Additional Notes
        </h3>
        <textarea
          value={config.additionalNotes}
          onChange={(e) => handleChange("additionalNotes", e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
          placeholder="e.g., Apple Pay shows on Safari/iOS; Venmo via PayPal on mobile (US)."
        />
      </div>
    </div>
  );
};

export default CommerceSettingsStep;
