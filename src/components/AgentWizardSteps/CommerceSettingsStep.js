"use client";

import React, { useState } from "react";
import { FiCreditCard, FiPlus, FiX } from "react-icons/fi";
import toast from "react-hot-toast";

// Section Separator Component
const SectionSeparator = () => (
  <div className="border-t-2 border-dashed border-gray-200 my-8"></div>
);

const CommerceSettingsStep = ({ config, onUpdate, errors = {} }) => {
  const [customInputs, setCustomInputs] = useState({});

  const handleChange = (field, value) => {
    onUpdate({ [field]: value });
  };

  const toggleOption = (category, option) => {
    const currentSelected = config[category]?.selected || [];
    const newSelected = currentSelected.includes(option)
      ? currentSelected.filter((item) => item !== option)
      : [...currentSelected, option];

    handleChange(category, {
      ...config[category],
      selected: newSelected,
    });
  };

  const addCustomOption = (category, customValue) => {
    if (!customValue.trim()) return;

    const currentOptions = config[category]?.options || [];
    const currentSelected = config[category]?.selected || [];

    // Add to options if not already present
    if (!currentOptions.includes(customValue)) {
      const newOptions = [...currentOptions, customValue];
      handleChange(category, {
        ...config[category],
        options: newOptions,
        selected: [...currentSelected, customValue],
      });
      toast.success(`Added "${customValue}" to ${category}`);
    } else {
      // Just add to selected if already in options
      const newSelected = [...currentSelected, customValue];
      handleChange(category, {
        ...config[category],
        selected: newSelected,
      });
      toast.success(`Selected "${customValue}"`);
    }

    // Clear the input
    setCustomInputs((prev) => ({ ...prev, [category]: "" }));
  };

  const removeOption = (category, option) => {
    const currentOptions = config[category]?.options || [];
    const currentSelected = config[category]?.selected || [];

    const newOptions = currentOptions.filter((item) => item !== option);
    const newSelected = currentSelected.filter((item) => item !== option);

    handleChange(category, {
      ...config[category],
      options: newOptions,
      selected: newSelected,
    });
  };

  const renderOptionSection = (category, title, description) => {
    const options = config[category]?.options || [];
    const selected = config[category]?.selected || [];
    const customInput = customInputs[category] || "";
    const hasError = errors[category];

    return (
      <div
        className={`bg-white rounded-sm border p-4 ${
          hasError ? "border-red-500" : "border-gray-200"
        }`}
      >
        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
          <FiCreditCard className="w-3.5 h-3.5 mr-2" />
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-600 mb-3">{description}</p>
        )}

        {/* Options Grid */}
        <div className="mb-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {options
              .sort((a, b) => {
                const aSelected = selected.includes(a);
                const bSelected = selected.includes(b);
                // Selected items first, then unselected
                if (aSelected && !bSelected) return -1;
                if (!aSelected && bSelected) return 1;
                return 0;
              })
              .map((option) => {
                const isSelected = selected.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => toggleOption(category, option)}
                    className={`px-2.5 py-1.5 rounded-sm text-xs font-medium transition-colors border cursor-pointer ${
                      isSelected
                        ? "bg-purple-50 border-purple-400 text-purple-800"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Add Custom Option */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) =>
              setCustomInputs((prev) => ({
                ...prev,
                [category]: e.target.value,
              }))
            }
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                addCustomOption(category, customInput);
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
            placeholder={`Add custom ${title.toLowerCase()}...`}
          />
          <button
            onClick={() => addCustomOption(category, customInput)}
            disabled={!customInput.trim()}
            className="bg-gray-900 text-white px-3 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs flex items-center gap-1"
          >
            <FiPlus className="w-3 h-3" />
            Add
          </button>
        </div>
        {hasError && <p className="text-xs text-red-600 mt-2">{hasError}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Commerce Settings Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Commerce Settings
        </h2>
        <p className="text-sm text-gray-600">
          Configure payment methods, shipping options, and discount categories
          for your store.
        </p>
      </div>

      {/* Payment Methods Section */}
      <div className="space-y-6">
        <h3 className="text-base font-medium text-gray-900">Payment Methods</h3>

        {/* Checkout Providers Section */}
        {renderOptionSection(
          "checkoutProviders",
          "Checkout Providers",
          "Select express checkout options available to customers"
        )}

        {/* Cards Accepted Section */}
        {renderOptionSection(
          "cardsAccepted",
          "Cards Accepted",
          "Select credit/debit cards accepted by your store"
        )}

        {/* Buy Now Pay Later Section */}
        {renderOptionSection(
          "buyNowPayLater",
          "Buy Now Pay Later",
          "Select BNPL providers available to customers"
        )}
      </div>

      <SectionSeparator />

      {/* Store Policies Section */}
      <div className="space-y-6">
        <h3 className="text-base font-medium text-gray-900">Store Policies</h3>

        {/* Discount Categories Section */}
        {renderOptionSection(
          "discountCategories",
          "Discount Categories",
          "Select discount categories your store offers"
        )}

        {/* Guest Checkout Section */}
        <div className="bg-white rounded-sm border border-gray-200 p-4">
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
                handleChange(
                  "guestCheckoutEnabled",
                  !config.guestCheckoutEnabled
                )
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                config.guestCheckoutEnabled ? "bg-purple-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.guestCheckoutEnabled
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <SectionSeparator />

      {/* Shipping & Logistics Section */}
      <div className="space-y-6">
        <h3 className="text-base font-medium text-gray-900">
          Shipping & Logistics
        </h3>

        {/* Shipping Methods Section */}
        {renderOptionSection(
          "shippingMethods",
          "Shipping Methods",
          "Select shipping carriers and methods available"
        )}
      </div>

      <SectionSeparator />

      {/* Additional Information Section */}
      <div className="space-y-6">
        <h3 className="text-base font-medium text-gray-900">
          Additional Information
        </h3>

        {/* Additional Notes Section */}
        <div className="bg-white rounded-sm border border-gray-200 p-4">
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
    </div>
  );
};

export default CommerceSettingsStep;
