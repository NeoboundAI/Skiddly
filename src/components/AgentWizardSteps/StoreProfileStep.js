"use client";

import React from "react";
import {
  FiShoppingBag,
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiMessageSquare,
} from "react-icons/fi";

const StoreProfileStep = ({ config, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      <div className="text-center mb-3">
        <h2 className="text-base font-bold text-gray-900 mb-0.5">Store Identity</h2>
        <p className="text-[11px] text-gray-600">
          This information will be displayed to your customers
        </p>
      </div>

      {/* Store Identity Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-2.5">
        <h3 className="text-xs font-semibold text-gray-900 mb-1.5 flex items-center">
          <FiShoppingBag className="w-3 h-3 mr-2" />
          Store Identity
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Store Name *
            </label>
            <input
              type="text"
              value={config.storeName}
              onChange={(e) => handleChange("storeName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              placeholder="e.g., Acme Outfitters"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Store URL *
            </label>
            <input
              type="text"
              value={config.storeUrl}
              onChange={(e) => handleChange("storeUrl", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              placeholder="e.g., acme-outfitters.myshopify.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tagline
            </label>
            <input
              type="text"
              value={config.tagline}
              onChange={(e) => handleChange("tagline", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              placeholder="e.g., Gear that goes the distance."
            />
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
          <FiMail className="w-4 h-4 mr-2" />
          Contact Information
        </h3>
        <p className="text-xs text-gray-600 mb-2.5">
          How customers can reach you for support
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Support Email *
            </label>
            <input
              type="email"
              value={config.supportEmail}
              onChange={(e) => handleChange("supportEmail", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              placeholder="e.g., support@acme.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={config.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              placeholder="e.g., +1 (415) 555-0199"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Business Address
            </label>
            <input
              type="text"
              value={config.businessAddress}
              onChange={(e) => handleChange("businessAddress", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              placeholder="e.g., 100 Market St, San Francisco, CA, USA"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Business Hours
            </label>
            <input
              type="text"
              value={config.businessHours}
              onChange={(e) => handleChange("businessHours", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              placeholder="e.g., Mon-Fri, 9am-6pm PT"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Support Channels
            </label>
            <input
              type="text"
              value={config.supportChannels}
              onChange={(e) => handleChange("supportChannels", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              placeholder="e.g., Email, Chat, Phone"
            />
          </div>
        </div>
      </div>

      {/* Store Details Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Store Details
        </h3>
        <p className="text-xs text-gray-600 mb-2.5">
          Additional information about your business
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Store Description
            </label>
            <textarea
              value={config.storeDescription}
              onChange={(e) => handleChange("storeDescription", e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              placeholder="Tell customers what makes your store special and what they can expect..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Store Category *
            </label>
            <select
              value={config.storeCategory}
              onChange={(e) => handleChange("storeCategory", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
            >
              <option value="">Select a category</option>
              <option value="fashion">Fashion & Apparel</option>
              <option value="electronics">Electronics</option>
              <option value="home">Home & Garden</option>
              <option value="beauty">Beauty & Personal Care</option>
              <option value="sports">Sports & Outdoors</option>
              <option value="books">Books & Media</option>
              <option value="food">Food & Beverage</option>
              <option value="automotive">Automotive</option>
              <option value="health">Health & Wellness</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fulfillment Method Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Fulfillment Method
        </h3>
        <p className="text-xs text-gray-600 mb-2.5">
          How will you deliver products to customers?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
              config.fulfillmentMethod === "shipping"
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleChange("fulfillmentMethod", "shipping")}
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiShoppingBag className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-xs">Shipping</h4>
                <p className="text-xs text-gray-600">
                  Ship products to customers
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
              config.fulfillmentMethod === "local-pickup"
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleChange("fulfillmentMethod", "local-pickup")}
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FiMapPin className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-xs">Local Pickup</h4>
                <p className="text-xs text-gray-600">
                  Customers collect in-store
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfileStep;
