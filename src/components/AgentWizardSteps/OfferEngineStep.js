"use client";

import React, { useState, useEffect } from "react";
import {
  FiGift,
  FiTag,
  FiTruck,
  FiCreditCard,
  FiRotateCcw,
  FiCheck,
  FiLoader,
  FiRefreshCw,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

// Section Separator Component
const SectionSeparator = () => (
  <div className="border-t-2 border-dashed border-gray-200 my-8"></div>
);

const OfferEngineStep = ({ config, onUpdate, errors = {}, selectedShop }) => {
  const [discountCodes, setDiscountCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  const handleChange = (field, value) => {
    onUpdate({ [field]: value });
  };

  const fetchDiscountCodes = async (force = false) => {
    if (!selectedShop?._id) return;

    try {
      setLoadingCodes(true);
      const response = await axios.get(
        `/api/shopify/discount-codes?shopId=${selectedShop._id}`
      );

      if (response.data.success) {
        const fetchedCodes = response.data.data;
        setDiscountCodes(fetchedCodes);

        // Update allCodes if force refresh or if it's empty
        if (
          force ||
          !config.availableDiscounts?.allCodes ||
          config.availableDiscounts.allCodes.length === 0
        ) {
          onUpdate({
            availableDiscounts: {
              ...config.availableDiscounts,
              allCodes: fetchedCodes,
            },
          });
        }
      } else {
        console.error("Failed to fetch discount codes:", response.data.error);
        toast.error("Failed to fetch discount codes");
      }
    } catch (error) {
      console.error("Error fetching discount codes:", error);
      toast.error("Error fetching discount codes");
    } finally {
      setLoadingCodes(false);
    }
  };

  useEffect(() => {
    if (selectedShop?._id) {
      // If we already have saved discount codes, use them first
      if (
        config.availableDiscounts?.allCodes &&
        config.availableDiscounts.allCodes.length > 0
      ) {
        setDiscountCodes(config.availableDiscounts.allCodes);
      } else {
        // Otherwise fetch fresh codes from Shopify
        fetchDiscountCodes();
      }
    }
  }, [selectedShop, config.availableDiscounts?.allCodes]);

  // Debug log to see what we have
  useEffect(() => {
    console.log(
      "Current config.availableDiscounts:",
      config.availableDiscounts
    );
    console.log("Current discountCodes state:", discountCodes);
  }, [config.availableDiscounts, discountCodes]);

  const handleDiscountToggle = (codeId, enabled) => {
    const currentSelected = config.availableDiscounts?.selectedCodes || [];
    let newSelected;

    if (enabled) {
      // Convert to string to match database format
      const stringId = String(codeId);
      newSelected = [...currentSelected, stringId];
    } else {
      // Handle both string and number comparisons when removing
      newSelected = currentSelected.filter(
        (id) => String(id) !== String(codeId) && id !== codeId
      );
    }

    onUpdate({
      availableDiscounts: {
        ...config.availableDiscounts,
        selectedCodes: newSelected,
        enabled: newSelected.length > 0,
      },
    });
  };

  const handleOfferToggle = (offerType, enabled) => {
    onUpdate({
      availableOffers: {
        ...config.availableOffers,
        [offerType]: {
          ...config.availableOffers?.[offerType],
          enabled,
        },
      },
    });
  };

  const handleOfferTextChange = (offerType, text) => {
    onUpdate({
      availableOffers: {
        ...config.availableOffers,
        [offerType]: {
          ...config.availableOffers?.[offerType],
          customText: text,
        },
      },
    });
  };

  const handleReturnPolicyToggle = (enabled) => {
    onUpdate({
      returnPolicy: {
        ...config.returnPolicy,
        enabled,
      },
    });
  };

  const handleReturnPolicyChange = (field, value) => {
    onUpdate({
      returnPolicy: {
        ...config.returnPolicy,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Offer Engine Header */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          Offer Engine
        </h2>
        <p className="text-xs text-gray-600">
          Set up promotions, discounts, incentives the agent can provide to
          recover carts.
        </p>
      </div>

      {/* Available Discounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Available Discounts
            </h3>
            <p className="text-xs text-gray-600">
              Select discount codes that your agent can offer to customers
            </p>
          </div>
          <button
            onClick={() => fetchDiscountCodes(true)}
            disabled={loadingCodes}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiRefreshCw
              className={`h-3 w-3 ${loadingCodes ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>

        <div className="">
          {loadingCodes ? (
            <div className="flex items-center justify-center py-6">
              <FiLoader className="animate-spin h-5 w-5 text-gray-400 mr-2" />
              <span className="text-xs text-gray-500">
                Loading discount codes...
              </span>
            </div>
          ) : discountCodes.length === 0 ? (
            <div className="text-center py-6">
              <FiTag className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-xs text-gray-500">
                No discount codes found in your store
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Create discount codes in your Shopify admin to use them here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {discountCodes.map((code) => {
                // Handle both string and number ID comparisons
                const codeId = code.id;
                const selectedCodes =
                  config.availableDiscounts?.selectedCodes || [];
                const isSelected = selectedCodes.some(
                  (selectedId) => selectedId == codeId || selectedId === codeId
                );

                // Debug log for each code
                console.log(
                  `Code ${code.code} (id: ${codeId}, type: ${typeof codeId}):`,
                  {
                    isSelected,
                    selectedCodes,
                    selectedCodesTypes: selectedCodes.map((id) => typeof id),
                    includes: selectedCodes.includes(codeId),
                    includesString: selectedCodes.includes(String(codeId)),
                    includesNumber: selectedCodes.includes(Number(codeId)),
                  }
                );
                const discountText =
                  code.value_type === "percentage"
                    ? `${Math.abs(parseFloat(code.value))}% off`
                    : code.value_type === "fixed_amount"
                    ? `$${Math.abs(parseFloat(code.value))} off`
                    : code.value;

                return (
                  <div
                    key={code.id}
                    className={`flex items-center space-x-2 p-3 rounded-lg border-2 ${
                      isSelected
                        ? "bg-purple-50 border-purple-400"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-3 h-3 text-purple-600 rounded"
                      checked={isSelected}
                      onChange={(e) =>
                        handleDiscountToggle(code.id, e.target.checked)
                      }
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">
                        {code.code}
                      </div>
                      <div className="text-xs text-green-600">
                        {discountText}
                      </div>
                      {code.title && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {code.title}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {code.usage_limit
                          ? `Limit: ${code.usage_limit}`
                          : "Unlimited"}
                      </div>
                      {code.starts_at && (
                        <div className="text-xs text-gray-400">
                          Starts:{" "}
                          {new Date(code.starts_at).toLocaleDateString()}
                        </div>
                      )}
                      {code.ends_at && (
                        <div className="text-xs text-gray-400">
                          Expires: {new Date(code.ends_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <SectionSeparator />

      {/* Available Offers Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900">Available Offers</h3>
        <p className="text-xs text-gray-600">
          Configure special offers your agent can provide
        </p>

        <div className="">
          <div className="space-y-3">
            {/* Free Shipping Offer */}
            <div
              className={`flex items-center space-x-2 p-3 rounded-lg border-2 ${
                config.availableOffers?.shippingDiscount?.enabled
                  ? "bg-purple-50 border-purple-400"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <input
                type="checkbox"
                className="w-3 h-3 text-purple-600 rounded"
                checked={
                  config.availableOffers?.shippingDiscount?.enabled || false
                }
                onChange={(e) =>
                  handleOfferToggle("shippingDiscount", e.target.checked)
                }
              />
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">
                  {config.availableOffers?.shippingDiscount?.description ||
                    "Offer free discounted shipping"}
                </div>
                <input
                  type="text"
                  className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="Enter custom text for this offer"
                  value={
                    config.availableOffers?.shippingDiscount?.customText || ""
                  }
                  onChange={(e) =>
                    handleOfferTextChange("shippingDiscount", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Payment Plans Offer */}
            <div
              className={`flex items-center space-x-2 p-3 rounded-lg border-2 ${
                config.availableOffers?.paymentPlans?.enabled
                  ? "bg-purple-50 border-purple-400"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <input
                type="checkbox"
                className="w-3 h-3 text-purple-600 rounded"
                checked={config.availableOffers?.paymentPlans?.enabled || false}
                onChange={(e) =>
                  handleOfferToggle("paymentPlans", e.target.checked)
                }
              />
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">
                  {config.availableOffers?.paymentPlans?.description ||
                    "Offer payment plans - for high value carts"}
                </div>
                <input
                  type="text"
                  className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="Enter custom text for this offer"
                  value={config.availableOffers?.paymentPlans?.customText || ""}
                  onChange={(e) =>
                    handleOfferTextChange("paymentPlans", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <SectionSeparator />

      {/* Return Policy Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900">Return Policy</h3>
        <p className="text-xs text-gray-600">
          Configure return policy information your agent can provide
        </p>

        <div className="">
          <div className="space-y-3">
            <div
              className={`flex items-center space-x-2 p-3 rounded-lg border-2 ${
                config.returnPolicy?.enabled
                  ? "bg-purple-50 border-purple-400"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <input
                type="checkbox"
                className="w-3 h-3 text-purple-600 rounded"
                checked={config.returnPolicy?.enabled || false}
                onChange={(e) => handleReturnPolicyToggle(e.target.checked)}
              />
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">
                  Enable return policy information
                </div>
                <div className="mt-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-600">
                      Return period (days):
                    </label>
                    <input
                      type="number"
                      className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs"
                      value={config.returnPolicy?.days || 30}
                      onChange={(e) =>
                        handleReturnPolicyChange(
                          "days",
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                  <input
                    type="text"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="Enter return policy description"
                    value={config.returnPolicy?.description || ""}
                    onChange={(e) =>
                      handleReturnPolicyChange("description", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferEngineStep;
