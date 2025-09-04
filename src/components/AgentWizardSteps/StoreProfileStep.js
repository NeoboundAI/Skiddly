"use client";

import React, { useState, useEffect } from "react";
import {
  FiShoppingBag,
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiMessageSquare,
  FiPlus,
  FiX,
} from "react-icons/fi";
import axios from "axios";

const StoreProfileStep = ({ config, onUpdate, selectedShop }) => {
  const [loading, setLoading] = useState(false);
  const [supportChannelInput, setSupportChannelInput] = useState("");
  console.log(selectedShop);

  const handleChange = (field, value) => {
    onUpdate({ [field]: value });
  };

  const handleBusinessHoursChange = (day, field, value) => {
    const updatedHours = {
      ...config.businessHours,
      [day]: {
        ...config.businessHours[day],
        [field]: value,
      },
    };
    onUpdate({ businessHours: updatedHours });
  };

  const addSupportChannel = () => {
    if (
      supportChannelInput.trim() &&
      !config.supportChannels.includes(supportChannelInput.trim())
    ) {
      const updatedChannels = [
        ...config.supportChannels,
        supportChannelInput.trim(),
      ];
      onUpdate({ supportChannels: updatedChannels });
      setSupportChannelInput("");
    }
  };

  const removeSupportChannel = (channel) => {
    const updatedChannels = config.supportChannels.filter((c) => c !== channel);
    onUpdate({ supportChannels: updatedChannels });
  };

  const handleFulfillmentMethodChange = (method) => {
    const currentMethods = config.fulfillmentMethod || [];
    if (currentMethods.includes(method)) {
      // Remove if already selected
      const updatedMethods = currentMethods.filter((m) => m !== method);
      onUpdate({ fulfillmentMethod: updatedMethods });
    } else {
      // Add if not selected
      const updatedMethods = [...currentMethods, method];
      onUpdate({ fulfillmentMethod: updatedMethods });
    }
  };

  const fetchShopInfo = async () => {
    if (!selectedShop?._id) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `/api/shopify/shop-info?shopId=${selectedShop._id}`
      );

      if (response.data.success) {
        const shopInfo = response.data.data;
        console.log("Fetched shop info:", shopInfo);

        // Update store profile with shop info
        onUpdate({
          storeName: shopInfo.name || config.storeName,
          storeUrl: shopInfo.myshopify_domain || selectedShop.shop,
          tagline: config.tagline, // Keep existing tagline as it's not in Shopify data
          supportEmail: shopInfo.customer_email || config.supportEmail,
          phoneNumber: shopInfo.phone || config.phoneNumber,
          businessAddress: shopInfo.address1
            ? `${shopInfo.address1}${
                shopInfo.address2 ? ", " + shopInfo.address2 : ""
              }${shopInfo.city ? ", " + shopInfo.city : ""}${
                shopInfo.province ? ", " + shopInfo.province : ""
              }${shopInfo.zip ? " " + shopInfo.zip : ""}${
                shopInfo.country_name ? ", " + shopInfo.country_name : ""
              }`
            : config.businessAddress,
          storeDescription: config.storeDescription, // Keep existing description as it's not in Shopify data
          storeCategory: config.storeCategory, // Keep existing category as it's not in Shopify data
          // Additional fields that can be useful
          businessHours: config.businessHours, // Keep existing business hours
          supportChannels: config.supportChannels, // Keep existing support channels
          fulfillmentMethod: config.fulfillmentMethod, // Keep existing fulfillment method
        });
      } else {
        console.error("Failed to fetch shop info:", response.data.error);
      }
    } catch (error) {
      console.error("Error fetching shop info:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedShop?._id) {
      fetchShopInfo();
    }
  }, [selectedShop]);

  const days = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  const storeCategories = [
    "Clothing",
    "Jewelry & Watches",
    "Home & Garden",
    "Fashion Accessories",
    "Health & Beauty",
    "Accessories",
    "Toys & Hobbies",
    "Shoes",
    "Books",
    "Food & Beverages",
    "Other Categories",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Store Identity Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Store Name
          </label>
          <input
            type="text"
            value={config.storeName}
            onChange={(e) => handleChange("storeName", e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            placeholder="Enter Here"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Domain
          </label>
          <input
            type="text"
            value={config.storeUrl}
            onChange={(e) => handleChange("storeUrl", e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            placeholder="Enter Here"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Tagline
          </label>
          <input
            type="text"
            value={config.tagline}
            onChange={(e) => handleChange("tagline", e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            placeholder="Enter Here"
          />
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900">
          Contact information
        </h3>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Support Email
          </label>
          <input
            type="email"
            value={config.supportEmail}
            onChange={(e) => handleChange("supportEmail", e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            placeholder="Enter Here"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Phone Number
          </label>
          <input
            type="tel"
            value={config.phoneNumber}
            onChange={(e) => handleChange("phoneNumber", e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            placeholder="Enter Here"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Business Address
          </label>
          <textarea
            value={config.businessAddress}
            onChange={(e) => handleChange("businessAddress", e.target.value)}
            rows={2}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            placeholder="Enter Here"
          />
        </div>

        {/* Business Hours */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Business Hours
          </label>
          <div className="space-y-2">
            {days.map((day) => (
              <div key={day.key} className="flex items-center space-x-3">
                <div className="w-20">
                  <span className="text-xs text-gray-600">{day.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.businessHours?.[day.key]?.isOpen || false}
                    onChange={(e) =>
                      handleBusinessHoursChange(
                        day.key,
                        "isOpen",
                        e.target.checked
                      )
                    }
                    className="h-3 w-3 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="text-xs text-gray-600">Open</span>
                </div>
                {config.businessHours?.[day.key]?.isOpen && (
                  <>
                    <input
                      type="time"
                      value={config.businessHours[day.key].startTime}
                      onChange={(e) =>
                        handleBusinessHoursChange(
                          day.key,
                          "startTime",
                          e.target.value
                        )
                      }
                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                    <span className="text-xs text-gray-500">to</span>
                    <input
                      type="time"
                      value={config.businessHours[day.key].endTime}
                      onChange={(e) =>
                        handleBusinessHoursChange(
                          day.key,
                          "endTime",
                          e.target.value
                        )
                      }
                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Support Channels */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Support Channels
          </label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {config.supportChannels?.map((channel, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800"
                >
                  {channel}
                  <button
                    type="button"
                    onClick={() => removeSupportChannel(channel)}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={supportChannelInput}
                onChange={(e) => setSupportChannelInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSupportChannel()}
                className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                placeholder="Add support channel"
              />
              <button
                type="button"
                onClick={addSupportChannel}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
              >
                <FiPlus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Store Details Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900">Store Details</h3>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Store Description
          </label>
          <textarea
            value={config.storeDescription}
            onChange={(e) => handleChange("storeDescription", e.target.value)}
            rows={3}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            placeholder="Enter Here"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Store Category
          </label>
          <select
            value={config.storeCategory}
            onChange={(e) => handleChange("storeCategory", e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          >
            <option value="">Standard</option>
            {storeCategories.map((category) => (
              <option
                key={category}
                value={category.toLowerCase().replace(/\s+/g, "-")}
              >
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fulfillment Method Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900">
          Fulfillment method
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
              config.fulfillmentMethod?.includes("shipping")
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleFulfillmentMethodChange("shipping")}
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiShoppingBag className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Shipping</h4>
                <p className="text-xs text-gray-600">
                  Ship products to customers
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
              config.fulfillmentMethod?.includes("pickup")
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleFulfillmentMethodChange("pickup")}
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FiMapPin className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">
                  Local Pickup
                </h4>
                <p className="text-xs text-gray-600">
                  Customers collect in-store
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fetch Shop Info Button */}
      {selectedShop?._id && (
        <div className="pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={fetchShopInfo}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
            ) : (
              <FiShoppingBag className="w-4 h-4" />
            )}
            <span>{loading ? "Fetching..." : "Fetch from Shopify"}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default StoreProfileStep;
