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
  FiChevronDown,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

// Reusable Input Component
const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  rows,
  options,
  className = "",
}) => {
  const baseInputClass = `w-full px-3 py-2 border ${
    error ? "border-red-500" : "border-gray-300"
  } rounded-md focus:outline-none focus:ring-1 focus:ring-purple-200 focus:border-transparent text-xs ${className}`;

  const renderInput = () => {
    if (type === "textarea") {
      return (
        <textarea
          value={value}
          onChange={onChange}
          rows={rows || 3}
          className={`${baseInputClass} resize-none`}
          placeholder={placeholder}
        />
      );
    }

    if (type === "select") {
      return (
        <div className="relative">
          <select
            value={value}
            onChange={onChange}
            className={`${baseInputClass} appearance-none bg-white`}
          >
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      );
    }

    return (
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={baseInputClass}
        placeholder={placeholder}
      />
    );
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      {renderInput()}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

// Section Separator Component
const SectionSeparator = () => (
  <div className="border-t-2 border-dashed border-gray-200 my-8"></div>
);

const StoreProfileStep = ({
  config,
  onUpdate,
  selectedShop,
  shopInfo,
  fetchingShopInfo,
  onValidationChange,
  errors = {},
}) => {
  const [supportChannelInput, setSupportChannelInput] = useState("");
  const [localErrors, setLocalErrors] = useState({});
  console.log(selectedShop);

  const handleChange = (field, value) => {
    onUpdate({ [field]: value });
    // Clear error when user starts typing
    if (localErrors[field]) {
      setLocalErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Use errors from parent (validation only happens on Next click)
  const displayErrors = errors;

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

  const categoryOptions = [
    { value: "", label: "Standard" },
    ...storeCategories.map((category) => ({
      value: category.toLowerCase().replace(/\s+/g, "-"),
      label: category,
    })),
  ];

  return (
    <div className="space-y-8">
      {/* Store Setup Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Store Setup
        </h2>
        <p className="text-sm text-gray-600">
          Provide store profile, help configuring hours, shipping methods.
        </p>
      </div>

      {/* Store Identity Section */}
      <div className="space-y-6">
        <h3 className="text-base font-medium text-gray-900">Store Identity</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Store Name"
            value={config.storeName}
            onChange={(e) => handleChange("storeName", e.target.value)}
            placeholder="Enter Here"
            error={displayErrors.storeName}
          />

          <InputField
            label="Domain"
            value={config.storeUrl}
            onChange={(e) => handleChange("storeUrl", e.target.value)}
            placeholder="Enter Here"
            error={displayErrors.storeUrl}
          />
        </div>

        <InputField
          label="Tagline"
          value={config.tagline}
          onChange={(e) => handleChange("tagline", e.target.value)}
          placeholder="Enter Here"
          error={displayErrors.tagline}
        />
      </div>

      <SectionSeparator />

      {/* Contact Information Section */}
      <div className="space-y-6">
        <h3 className="text-base font-medium text-gray-900">
          Contact information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Support Email"
            type="email"
            value={config.supportEmail}
            onChange={(e) => handleChange("supportEmail", e.target.value)}
            placeholder="Enter Here"
            error={displayErrors.supportEmail}
          />

          <InputField
            label="Phone Number"
            type="tel"
            value={config.phoneNumber}
            onChange={(e) => handleChange("phoneNumber", e.target.value)}
            placeholder="Enter Here"
            error={displayErrors.phoneNumber}
          />
        </div>

        <InputField
          label="Business Address"
          type="textarea"
          value={config.businessAddress}
          onChange={(e) => handleChange("businessAddress", e.target.value)}
          placeholder="Enter Here"
          error={displayErrors.businessAddress}
          rows={3}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Business Hours
          </label>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {days.map((day, index) => (
              <div
                key={day.key}
                className={`flex items-center px-4 py-3 ${
                  index !== days.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                {/* Day name - fixed width */}
                <div className="w-24">
                  <span className="text-sm text-gray-700">{day.label}</span>
                </div>

                {/* Status indicator - fixed width */}
                <div className="w-20 flex items-center">
                  <span
                    className={`text-xs ${
                      config.businessHours?.[day.key]?.isOpen
                        ? "text-gray-600"
                        : "text-gray-400"
                    }`}
                  >
                    {config.businessHours?.[day.key]?.isOpen
                      ? "Open"
                      : "Closed"}
                  </span>
                </div>

                {/* Toggle Switch - fixed width */}
                <div className="w-16 flex justify-center">
                  <label className="relative inline-flex items-center cursor-pointer">
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
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Time selection - takes remaining space */}
                <div className="flex-1 flex items-center justify-end space-x-3">
                  <input
                    type="time"
                    value={
                      config.businessHours?.[day.key]?.startTime || "09:00"
                    }
                    onChange={(e) =>
                      handleBusinessHoursChange(
                        day.key,
                        "startTime",
                        e.target.value
                      )
                    }
                    disabled={!config.businessHours?.[day.key]?.isOpen}
                    className={`px-2 py-1 border border-gray-300 rounded text-xs w-20 focus:outline-none focus:ring-1 focus:ring-purple-200 focus:border-transparent ${
                      config.businessHours?.[day.key]?.isOpen
                        ? "bg-white text-gray-900"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      config.businessHours?.[day.key]?.isOpen
                        ? "text-gray-500"
                        : "text-gray-300"
                    }`}
                  >
                    to
                  </span>
                  <input
                    type="time"
                    value={config.businessHours?.[day.key]?.endTime || "17:00"}
                    onChange={(e) =>
                      handleBusinessHoursChange(
                        day.key,
                        "endTime",
                        e.target.value
                      )
                    }
                    disabled={!config.businessHours?.[day.key]?.isOpen}
                    className={`px-2 py-1 border border-gray-300 rounded text-xs w-20 focus:outline-none focus:ring-1 focus:ring-purple-200 focus:border-transparent ${
                      config.businessHours?.[day.key]?.isOpen
                        ? "bg-white text-gray-900"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Support Channels
          </label>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 ">
              {config.supportChannels?.length > 0 &&
                config.supportChannels.map((channel, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-800"
                  >
                    {channel}
                    <button
                      type="button"
                      onClick={() => removeSupportChannel(channel)}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      <FiX className="w-3 h-3 text-black cursor-pointer" />
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-200 focus:border-transparent text-xs"
                placeholder="Add support channel"
              />
              <button
                type="button"
                onClick={addSupportChannel}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-xs font-medium"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      <SectionSeparator />

      {/* Store Details Section */}
      <div className="space-y-6">
        <h3 className="text-base font-medium text-gray-900">Store Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Store Description"
            type="textarea"
            value={config.storeDescription}
            onChange={(e) => handleChange("storeDescription", e.target.value)}
            placeholder="Enter Here"
            error={displayErrors.storeDescription}
            rows={4}
          />

          <InputField
            label="Store Category"
            type="select"
            value={config.storeCategory}
            onChange={(e) => handleChange("storeCategory", e.target.value)}
            options={categoryOptions}
            error={displayErrors.storeCategory}
          />
        </div>
      </div>

      <SectionSeparator />

      {/* Fulfillment Method Section */}
      <div className="space-y-6">
        <h3 className="text-base font-medium text-gray-900">
          Fulfillment method
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`p-3 border-2 rounded-md cursor-pointer transition-all ${
              config.fulfillmentMethod?.includes("shipping")
                ? "border-purple-500 bg-purple-50"
                : displayErrors.fulfillmentMethod
                ? "border-red-500 hover:border-red-400"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleFulfillmentMethodChange("shipping")}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <FiShoppingBag className="w-4 h-4 text-purple-600" />
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
            className={`p-3 border-2 rounded-md cursor-pointer transition-all ${
              config.fulfillmentMethod?.includes("pickup")
                ? "border-purple-500 bg-purple-50"
                : displayErrors.fulfillmentMethod
                ? "border-red-500 hover:border-red-400"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleFulfillmentMethodChange("pickup")}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <FiMapPin className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-xs">
                  Local Pickup
                </h4>
                <p className="text-xs text-gray-600">
                  Customers collect in-store
                </p>
              </div>
            </div>
          </div>
        </div>
        {displayErrors.fulfillmentMethod && (
          <p className="text-xs text-red-600 mt-2">
            {displayErrors.fulfillmentMethod}
          </p>
        )}
      </div>
    </div>
  );
};

export default StoreProfileStep;
