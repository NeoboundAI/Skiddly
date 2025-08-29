"use client";

import React from "react";
import {
  FiGift,
  FiTag,
  FiTruck,
  FiCreditCard,
  FiRotateCcw,
} from "react-icons/fi";

const OfferEngineStep = ({ config, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="text-center mb-3">
        <h2 className="text-base font-bold text-gray-900 mb-0.5">
          Offers & Discounts
        </h2>
        <p className="text-[11px] text-gray-600">
          Set up incentives to recover abandoned carts
        </p>
      </div>

      {/* Shopify Discount Codes Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 flex items-center">
            <FiTag className="w-4 h-4 mr-2 text-purple-600" />
            Shopify Discount Codes
          </h3>
          <button className="text-purple-600 hover:text-purple-700 font-medium text-xs">
            Hide Sync
          </button>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          Import discount codes directly from your Shopify store with automatic
          validity tracking
        </p>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-xs">
              Connect to Shopify
            </button>
            <span className="text-xs text-gray-600">
              Fetch all active discount codes
            </span>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2 text-xs">
              Available Discount Codes:
            </h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-2 bg-white rounded-lg border">
                <input
                  type="checkbox"
                  className="text-blue-600"
                  defaultChecked
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-xs">SAVE15</div>
                  <div className="text-xs text-gray-600">Percentage - 15%</div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-[10px] rounded-full">
                    Active
                  </span>
                  <div className="text-[10px] text-gray-500 mt-1">
                    Expires: 2025-12-31
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Discount Code Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          Primary Discount Code (Manual Entry)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Discount Code
            </label>
            <input
              type="text"
              value={config.primaryDiscountCode}
              onChange={(e) =>
                handleChange("primaryDiscountCode", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              placeholder="e.g., SAVE15"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Discount Value
            </label>
            <input
              type="text"
              value={config.primaryDiscountValue}
              onChange={(e) =>
                handleChange("primaryDiscountValue", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              placeholder="% off (e.g., 15)"
            />
          </div>
        </div>
      </div>

      {/* Shipping Offers Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center">
              <FiTruck className="w-4 h-4 mr-2" />
              Offer Free/Discounted Shipping
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Provide shipping incentives to encourage purchases
            </p>
          </div>
          <button
            onClick={() =>
              handleChange(
                "offerShippingDiscount",
                !config.offerShippingDiscount
              )
            }
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
              config.offerShippingDiscount ? "bg-purple-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                config.offerShippingDiscount ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {config.offerShippingDiscount && (
          <div className="mt-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Shipping Offer Text
            </label>
            <input
              type="text"
              value={config.shippingDiscountText}
              onChange={(e) =>
                handleChange("shippingDiscountText", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              placeholder="e.g., Free shipping or $5 off"
            />
          </div>
        )}
      </div>

      {/* Payment Plans Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center">
              <FiCreditCard className="w-4 h-4 mr-2" />
              Offer Payment Plans (for high-value carts)
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Enable buy now, pay later options for expensive items
            </p>
          </div>
          <button
            onClick={() =>
              handleChange("offerPaymentPlans", !config.offerPaymentPlans)
            }
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
              config.offerPaymentPlans ? "bg-purple-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                config.offerPaymentPlans ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Return Policy Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          <FiRotateCcw className="w-4 h-4 mr-2" />
          Return Policy
        </h3>

        <select
          value={config.returnPolicy}
          onChange={(e) => handleChange("returnPolicy", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
        >
          <option value="30 days return">30 days return</option>
          <option value="14 days return">14 days return</option>
          <option value="7 days return">7 days return</option>
          <option value="No returns">No returns</option>
          <option value="Lifetime warranty">Lifetime warranty</option>
        </select>
      </div>
    </div>
  );
};

export default OfferEngineStep;
