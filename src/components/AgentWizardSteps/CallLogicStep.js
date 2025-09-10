"use client";

import React, { useState, useEffect } from "react";
import {
  FiPhone,
  FiPlus,
  FiX,
  FiClock,
  FiCalendar,
  FiShoppingBag,
  FiUser,
  FiPackage,
  FiMapPin,
  FiTag,
  FiCreditCard,
} from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

// Section Separator Component
const SectionSeparator = () => (
  <div className="border-t-2 border-dashed border-gray-200 my-8"></div>
);

const CallLogicStep = ({
  config,
  onUpdate,
  errors = {},
  selectedShop,
  commerceSettings,
}) => {
  const [discountCodes, setDiscountCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");

  // Get all supported timezones
  const allTimezones = Intl.supportedValuesOf('timeZone');

  console.log(selectedShop);
  const handleChange = (field, value) => {
    onUpdate({ [field]: value });
  };

  const fetchDiscountCodes = async () => {
    if (!selectedShop?._id) return;

    try {
      setLoadingCodes(true);
      const response = await axios.get(
        `/api/shopify/discount-codes?shopId=${selectedShop._id}`
      );

      if (response.data.success) {
        setDiscountCodes(response.data.data);
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

  const fetchProducts = async () => {
    if (!selectedShop?._id) return;

    try {
      setLoadingProducts(true);
      console.log("Fetching products for shop:", selectedShop._id);
      const response = await axios.get(
        `/api/shopify/products?shopId=${selectedShop._id}`
      );

      console.log("Products response:", response.data);
      if (response.data.success) {
        setProducts(response.data.data);
        console.log("Products set:", response.data.data);
      } else {
        console.error("Failed to fetch products:", response.data.error);
        toast.error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Error fetching products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchLocations = async (query) => {
    if (!query || query.length < 2) {
      setLocations([]);
      return;
    }

    try {
      setLoadingLocations(true);
      const response = await axios.get(
        `/api/google/places?query=${encodeURIComponent(query)}&type=cities`
      );

      if (response.data.success) {
        setLocations(response.data.data);
      } else {
        console.error("Failed to fetch locations:", response.data.error);
        toast.error("Failed to fetch locations");
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Error fetching locations");
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    if (selectedShop?._id) {
      fetchDiscountCodes();
      fetchProducts();
    }
  }, [selectedShop]);

  // Debounced location search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (locationSearchQuery) {
        fetchLocations(locationSearchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [locationSearchQuery]);

  const addCondition = () => {
    const newCondition = {
      type: "cart-value",
      operator: ">=",
      value: "",
      enabled: true,
    };
    const newConditions = [...(config.conditions || []), newCondition];
    handleChange("conditions", newConditions);
  };

  const updateCondition = (index, field, value) => {
    const newConditions = [...(config.conditions || [])];
    newConditions[index] = { ...newConditions[index], [field]: value };
    handleChange("conditions", newConditions);
  };

  const removeCondition = (index) => {
    const newConditions = (config.conditions || []).filter(
      (_, i) => i !== index
    );
    handleChange("conditions", newConditions);
  };

  const toggleCondition = (index) => {
    const newConditions = [...(config.conditions || [])];
    newConditions[index] = {
      ...newConditions[index],
      enabled: !newConditions[index].enabled,
    };
    handleChange("conditions", newConditions);
  };

  const conditionTypes = [
    {
      id: "cart-value",
      name: "Cart Value",
      icon: FiShoppingBag,
      operators: [">=", "<=", "==", "!="],
      placeholder: "USD 120",
    },
    {
      id: "products",
      name: "Products",
      icon: FiPackage,
      operators: ["includes", "excludes"],
      placeholder: "Headphone, Smart Watch, Iphone",
    },
    {
      id: "customer-type",
      name: "Customer Type",
      icon: FiUser,
      operators: ["includes", "excludes"],
      placeholder: "New, Returning, VIP",
    },
    {
      id: "previous-orders",
      name: "Previously Ordered",
      icon: FiClock,
      operators: [">=", "<=", "=="],
      placeholder: "5",
    },
    {
      id: "location",
      name: "Location",
      icon: FiMapPin,
      operators: ["includes", "excludes"],
      placeholder: "New York, London, Toronto",
    },
    {
      id: "coupon-code",
      name: "Coupon Code",
      icon: FiTag,
      operators: ["includes", "excludes"],
      placeholder: "SAVE15, WELCOME10",
    },
    {
      id: "payment-method",
      name: "Payment Method",
      icon: FiCreditCard,
      operators: ["includes", "excludes"],
      placeholder: "Credit Card, PayPal, Apple Pay",
    },
  ];

  const getConditionColor = (index) => {
    const colors = [
      "bg-green-50",
      "bg-orange-50",
      "bg-purple-50",
      "bg-blue-50",
      "bg-red-50",
      "bg-pink-50",
      "bg-indigo-50",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-8">
      {/* Call Logic Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Call Logic</h2>
        <p className="text-xs text-gray-500">
          Configure, wait times, call conditions, call schedules, retries,
          weekend behavior, voicemail handling.
        </p>
      </div>

      {/* Call Conditions Section - Redesigned to match image */}
      <div className="space-y-6">
        <div
          className={`bg-white ${
            errors.conditions ? "border-red-500" : "border-gray-200"
          }`}
        >
          <div className="space-y-3">
            {(config.conditions || []).map((condition, index) => {
              const conditionType = conditionTypes.find(
                (t) => t.id === condition.type
              );
              const Icon = conditionType?.icon || FiShoppingBag;

              return (
                <div key={index}>
                  <div
                    className={`flex items-center p-4 rounded-lg border ${
                      condition.enabled
                        ? "bg-purple-50 border-purple-400"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    {/* Icon and Label - 25% width */}
                    <div className="flex items-center space-x-3 w-1/4">
                      <div className="w-5 h-5 border border-gray-400 rounded flex items-center justify-center">
                        <Icon className="w-3 h-3 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {conditionType?.name}
                      </span>
                    </div>

                    {/* Operator - 25% width */}
                    <div className="w-1/4">
                      <select
                        value={condition.operator}
                        onChange={(e) =>
                          updateCondition(index, "operator", e.target.value)
                        }
                        className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        {conditionType?.operators.map((op) => (
                          <option key={op} value={op}>
                            {op === ">="
                              ? "Greater than equals"
                              : op === "<="
                              ? "Less than equals"
                              : op === "=="
                              ? "Equals"
                              : op === "!="
                              ? "Not equals"
                              : op === "includes"
                              ? "Includes"
                              : op === "excludes"
                              ? "Excludes"
                              : op === "is"
                              ? "Is"
                              : op === "is not"
                              ? "Is not"
                              : op}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Value Section - 25% width */}
                    <div className="w-[50%] flex items-center pl-10">
                      <div className="w-[70%] flex min-w-[300px] items-center justify-center ">
                        {condition.type === "customer-type" ? (
                          <div className="flex flex-col ">
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  const currentValue = condition.value || [];
                                  const isArray = Array.isArray(currentValue);
                                  const currentTypes = isArray
                                    ? currentValue
                                    : currentValue
                                    ? [currentValue]
                                    : [];

                                  if (!currentTypes.includes(e.target.value)) {
                                    const newTypes = [
                                      ...currentTypes,
                                      e.target.value,
                                    ];
                                    updateCondition(index, "value", newTypes);
                                  }
                                  e.target.value = ""; // Reset select
                                }
                              }}
                              className=" px-3 py-1 border w-[300px] border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                              <option value="">Add customer type</option>
                              <option value="New">New</option>
                              <option value="Returning">Returning</option>
                              <option value="VIP">VIP</option>
                            </select>

                            {/* Display selected customer types */}
                            {condition.value && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(Array.isArray(condition.value)
                                  ? condition.value
                                  : [condition.value]
                                ).map((type, typeIndex) => (
                                  <span
                                    key={typeIndex}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800"
                                  >
                                    {type}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentValue =
                                          condition.value || [];
                                        const isArray =
                                          Array.isArray(currentValue);
                                        const currentTypes = isArray
                                          ? currentValue
                                          : [currentValue];
                                        const newTypes = currentTypes.filter(
                                          (_, i) => i !== typeIndex
                                        );
                                        updateCondition(
                                          index,
                                          "value",
                                          newTypes.length === 1
                                            ? newTypes[0]
                                            : newTypes
                                        );
                                      }}
                                      className="ml-1 text-purple-600 hover:text-purple-800"
                                    >
                                      <FiX className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : condition.type === "coupon-code" ? (
                          <div className="flex flex-col ">
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  const currentValue = condition.value || [];
                                  const isArray = Array.isArray(currentValue);
                                  const currentCodes = isArray
                                    ? currentValue
                                    : currentValue
                                    ? [currentValue]
                                    : [];

                                  if (!currentCodes.includes(e.target.value)) {
                                    const newCodes = [
                                      ...currentCodes,
                                      e.target.value,
                                    ];
                                    updateCondition(index, "value", newCodes);
                                  }
                                  e.target.value = ""; // Reset select
                                }
                              }}
                              className=" px-3 w-[300px] py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                              disabled={loadingCodes}
                            >
                              <option value="">
                                {loadingCodes
                                  ? "Loading codes..."
                                  : "Add discount code"}
                              </option>
                              {discountCodes.map((code) => {
                                const discountText =
                                  code.value_type === "percentage"
                                    ? `${Math.abs(parseFloat(code.value))}% off`
                                    : code.value_type === "fixed_amount"
                                    ? `$${Math.abs(parseFloat(code.value))} off`
                                    : code.value;

                                return (
                                  <option key={code.id} value={code.code}>
                                    {code.code} - {discountText} ({code.title})
                                  </option>
                                );
                              })}
                            </select>

                            {/* Display selected codes */}
                            {condition.value && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(Array.isArray(condition.value)
                                  ? condition.value
                                  : [condition.value]
                                ).map((code, codeIndex) => (
                                  <span
                                    key={codeIndex}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800"
                                  >
                                    {code}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentValue =
                                          condition.value || [];
                                        const isArray =
                                          Array.isArray(currentValue);
                                        const currentCodes = isArray
                                          ? currentValue
                                          : [currentValue];
                                        const newCodes = currentCodes.filter(
                                          (_, i) => i !== codeIndex
                                        );
                                        updateCondition(
                                          index,
                                          "value",
                                          newCodes.length === 1
                                            ? newCodes[0]
                                            : newCodes
                                        );
                                      }}
                                      className="ml-1 text-purple-600 hover:text-purple-800"
                                    >
                                      <FiX className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : condition.type === "products" ? (
                          <div className="flex flex-col ">
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  const currentValue = condition.value || [];
                                  const isArray = Array.isArray(currentValue);
                                  const currentProducts = isArray
                                    ? currentValue
                                    : currentValue
                                    ? [currentValue]
                                    : [];

                                  if (
                                    !currentProducts.includes(e.target.value)
                                  ) {
                                    const newProducts = [
                                      ...currentProducts,
                                      e.target.value,
                                    ];
                                    updateCondition(
                                      index,
                                      "value",
                                      newProducts
                                    );
                                  }
                                  e.target.value = ""; // Reset select
                                }
                              }}
                              className=" px-3 w-[300px] py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                              disabled={loadingProducts}
                            >
                              <option value="">
                                {loadingProducts
                                  ? "Loading products..."
                                  : "Add product"}
                              </option>
                              {products.map((product) => (
                                <option key={product.id} value={product.title}>
                                  {product.title} - $
                                  {product.variants[0]?.price || "N/A"}
                                </option>
                              ))}
                            </select>

                            {/* Display selected products */}
                            {condition.value && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(Array.isArray(condition.value)
                                  ? condition.value
                                  : [condition.value]
                                ).map((product, productIndex) => (
                                  <span
                                    key={productIndex}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800"
                                  >
                                    {product}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentValue =
                                          condition.value || [];
                                        const isArray =
                                          Array.isArray(currentValue);
                                        const currentProducts = isArray
                                          ? currentValue
                                          : [currentValue];
                                        const newProducts =
                                          currentProducts.filter(
                                            (_, i) => i !== productIndex
                                          );
                                        updateCondition(
                                          index,
                                          "value",
                                          newProducts.length === 1
                                            ? newProducts[0]
                                            : newProducts
                                        );
                                      }}
                                      className="ml-1 text-purple-600 hover:text-purple-800"
                                    >
                                      <FiX className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : condition.type === "location" ? (
                          <div className="flex flex-col  relative">
                            <div className="relative">
                              <input
                                type="text"
                                value={locationSearchQuery}
                                onChange={(e) =>
                                  setLocationSearchQuery(e.target.value)
                                }
                                placeholder="Search for cities..."
                                className=" px-3 w-[300px] py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                              />
                              {loadingLocations && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                                </div>
                              )}
                            </div>

                            {/* Location suggestions dropdown */}
                            {locations.length > 0 && locationSearchQuery && (
                              <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                                {locations.map((location) => (
                                  <button
                                    key={location.id}
                                    type="button"
                                    onClick={() => {
                                      const currentValue =
                                        condition.value || [];
                                      const isArray =
                                        Array.isArray(currentValue);
                                      const currentLocations = isArray
                                        ? currentValue
                                        : currentValue
                                        ? [currentValue]
                                        : [];

                                      if (
                                        !currentLocations.includes(
                                          location.display_name
                                        )
                                      ) {
                                        const newLocations = [
                                          ...currentLocations,
                                          location.display_name,
                                        ];
                                        updateCondition(
                                          index,
                                          "value",
                                          newLocations
                                        );
                                      }
                                      setLocationSearchQuery("");
                                      setLocations([]);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="font-medium">
                                      {location.name}
                                    </div>
                                    <div className="text-gray-500 text-xs">
                                      {location.formatted_address}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Display selected locations */}
                            {condition.value && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(Array.isArray(condition.value)
                                  ? condition.value
                                  : [condition.value]
                                ).map((location, locationIndex) => (
                                  <span
                                    key={locationIndex}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800"
                                  >
                                    {location}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentValue =
                                          condition.value || [];
                                        const isArray =
                                          Array.isArray(currentValue);
                                        const currentLocations = isArray
                                          ? currentValue
                                          : [currentValue];
                                        const newLocations =
                                          currentLocations.filter(
                                            (_, i) => i !== locationIndex
                                          );
                                        updateCondition(
                                          index,
                                          "value",
                                          newLocations.length === 1
                                            ? newLocations[0]
                                            : newLocations
                                        );
                                      }}
                                      className="ml-1 text-purple-600 hover:text-purple-800"
                                    >
                                      <FiX className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : condition.type === "payment-method" ? (
                          <div className="flex flex-col ">
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  const currentValue = condition.value || [];
                                  const isArray = Array.isArray(currentValue);
                                  const currentMethods = isArray
                                    ? currentValue
                                    : currentValue
                                    ? [currentValue]
                                    : [];

                                  if (
                                    !currentMethods.includes(e.target.value)
                                  ) {
                                    const newMethods = [
                                      ...currentMethods,
                                      e.target.value,
                                    ];
                                    updateCondition(index, "value", newMethods);
                                  }
                                  e.target.value = ""; // Reset select
                                }
                              }}
                              className=" px-3 w-[300px] py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                              <option value="">Add payment method</option>
                              {commerceSettings?.cardsAccepted?.selected?.map(
                                (method) => (
                                  <option key={method} value={method}>
                                    {method}
                                  </option>
                                )
                              )}
                            </select>

                            {/* Display selected payment methods */}
                            {condition.value && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(Array.isArray(condition.value)
                                  ? condition.value
                                  : [condition.value]
                                ).map((method, methodIndex) => (
                                  <span
                                    key={methodIndex}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800"
                                  >
                                    {method}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentValue =
                                          condition.value || [];
                                        const isArray =
                                          Array.isArray(currentValue);
                                        const currentMethods = isArray
                                          ? currentValue
                                          : [currentValue];
                                        const newMethods =
                                          currentMethods.filter(
                                            (_, i) => i !== methodIndex
                                          );
                                        updateCondition(
                                          index,
                                          "value",
                                          newMethods.length === 1
                                            ? newMethods[0]
                                            : newMethods
                                        );
                                      }}
                                      className="ml-1 text-purple-600 hover:text-purple-800"
                                    >
                                      <FiX className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={condition.value}
                            onChange={(e) =>
                              updateCondition(index, "value", e.target.value)
                            }
                            className=" px-3 w-[300px] py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            placeholder={
                              conditionType?.placeholder || "Enter value"
                            }
                          />
                        )}
                      </div>
                      <div className="w-[30%] flex justify-end">
                        <button
                          onClick={() => toggleCondition(index)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            condition.enabled ? "bg-purple-600" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              condition.enabled
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {index < (config.conditions || []).length - 1 && (
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-2 border-dashed border-gray-300"></div>
                      </div>
                      <div className="relative flex ml-10 justify-start">
                        <span className="bg-white text-gray-600 px-3 py-1 text-xs font-medium">
                          AND
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* <button
            onClick={addCondition}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors flex items-center justify-center space-x-2 text-sm text-gray-600 hover:text-purple-600"
          >
              <FiPlus className="w-5 h-5" />
            <span>Add New Condition</span>
            </button> */}
          </div>

          {errors.conditions && (
            <p className="text-sm text-red-600 mt-2">{errors.conditions}</p>
          )}
        </div>
      </div>

      <SectionSeparator />

      {/* Call Schedule Section */}
      <div className="space-y-6">
        <h3 className="text-base font-medium text-gray-900">Call Schedule</h3>
        <p className="text-sm text-gray-600">
          Configure timing, retries, and call behavior settings
        </p>

        <div
          className={`bg-white rounded-lg border-2 p-4 ${
            errors.callSchedule ? "border-red-500" : "border-gray-200"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Wait Time
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={config.callSchedule?.waitTime}
                  onChange={(e) =>
                    handleChange("callSchedule", {
                      ...config.callSchedule,
                      waitTime: e.target.value,
                    })
                  }
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="2"
                />
                <select
                  value={config.callSchedule?.waitTimeUnit}
                  onChange={(e) =>
                    handleChange("callSchedule", {
                      ...config.callSchedule,
                      waitTimeUnit: e.target.value,
                    })
                  }
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Max Retries
              </label>
              <select
                value={config.callSchedule?.maxRetries || 3}
                onChange={(e) =>
                  handleChange("callSchedule", {
                    ...config.callSchedule,
                    maxRetries: parseInt(e.target.value),
                  })
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={6}>6</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Retry Intervals
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Configure the delay between retry attempts. Only the first{" "}
                {config.callSchedule?.maxRetries || 0} attempts will be used
                based on your Max Retries setting.
              </p>
              <div className="space-y-2">
                {Array.from(
                  { length: config.callSchedule?.maxRetries || 3 },
                  (_, index) => {
                    const interval = (config.callSchedule?.retryIntervals ||
                      [])[index] || {
                      attempt: index + 1,
                      delay:
                        index === 0
                          ? 30
                          : index === 1
                          ? 5
                          : index === 2
                          ? 3
                          : 1,
                      delayUnit:
                        index === 0
                          ? "minutes"
                          : index === 1
                          ? "minutes"
                          : index === 2
                          ? "hours"
                          : "days",
                      description:
                        index === 0
                          ? "After 30 minutes after abandoned cart"
                          : index === 1
                          ? "After 5 minutes from 1st attempt"
                          : index === 2
                          ? "After 3 hours from 2nd attempt"
                          : index === 3
                          ? "Next day from 3rd attempt"
                          : index === 4
                          ? "Following day from 4th attempt"
                          : "After 3 days from 5th attempt",
                    };

                    return (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-2 rounded-lg bg-purple-50 border border-purple-400"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-gray-700">
                              Attempt {interval.attempt}:
                            </span>
                          </div>
                          <input
                            type="number"
                            value={interval.delay}
                            onChange={(e) => {
                              // Ensure we have all 6 intervals (even though we only show maxRetries)
                              const currentIntervals =
                                config.callSchedule?.retryIntervals || [];
                              const newIntervals = Array.from(
                                { length: 6 },
                                (_, i) =>
                                  currentIntervals[i] || {
                                    attempt: i + 1,
                                    delay:
                                      i === 0
                                        ? 30
                                        : i === 1
                                        ? 5
                                        : i === 2
                                        ? 3
                                        : 1,
                                    delayUnit:
                                      i === 0
                                        ? "minutes"
                                        : i === 1
                                        ? "minutes"
                                        : i === 2
                                        ? "hours"
                                        : "days",
                                    description:
                                      i === 0
                                        ? "After 30 minutes after abandoned cart"
                                        : i === 1
                                        ? "After 5 minutes from 1st attempt"
                                        : i === 2
                                        ? "After 3 hours from 2nd attempt"
                                        : i === 3
                                        ? "Next day from 3rd attempt"
                                        : i === 4
                                        ? "Following day from 4th attempt"
                                        : "After 3 days from 5th attempt",
                                  }
                              );
                              const delay = parseInt(e.target.value) || 0;
                              const delayUnit = newIntervals[index].delayUnit;

                              // Update description based on delay and unit
                              let description = "";
                              if (index === 0) {
                                description = `After ${delay} ${delayUnit} after abandoned cart`;
                              } else {
                                description = `After ${delay} ${delayUnit} from attempt ${index}`;
                              }

                              newIntervals[index] = {
                                ...newIntervals[index],
                                delay: delay,
                                description: description,
                              };
                              handleChange("callSchedule", {
                                ...config.callSchedule,
                                retryIntervals: newIntervals,
                              });
                            }}
                            className="w-20 text-xs px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                            min="0"
                          />
                          <select
                            value={interval.delayUnit}
                            onChange={(e) => {
                              // Ensure we have all 6 intervals (even though we only show maxRetries)
                              const currentIntervals =
                                config.callSchedule?.retryIntervals || [];
                              const newIntervals = Array.from(
                                { length: 6 },
                                (_, i) =>
                                  currentIntervals[i] || {
                                    attempt: i + 1,
                                    delay:
                                      i === 0
                                        ? 30
                                        : i === 1
                                        ? 5
                                        : i === 2
                                        ? 3
                                        : 1,
                                    delayUnit:
                                      i === 0
                                        ? "minutes"
                                        : i === 1
                                        ? "minutes"
                                        : i === 2
                                        ? "hours"
                                        : "days",
                                    description:
                                      i === 0
                                        ? "After 30 minutes after abandoned cart"
                                        : i === 1
                                        ? "After 5 minutes from 1st attempt"
                                        : i === 2
                                        ? "After 3 hours from 2nd attempt"
                                        : i === 3
                                        ? "Next day from 3rd attempt"
                                        : i === 4
                                        ? "Following day from 4th attempt"
                                        : "After 3 days from 5th attempt",
                                  }
                              );
                              const delay = newIntervals[index].delay;
                              const delayUnit = e.target.value;

                              // Update description based on delay and unit
                              let description = "";
                              if (index === 0) {
                                description = `After ${delay} ${delayUnit} after abandoned cart`;
                              } else {
                                description = `After ${delay} ${delayUnit} from attempt ${index}`;
                              }

                              newIntervals[index] = {
                                ...newIntervals[index],
                                delayUnit: delayUnit,
                                description: description,
                              };
                              handleChange("callSchedule", {
                                ...config.callSchedule,
                                retryIntervals: newIntervals,
                              });
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <span className="text-xs text-gray-600">
                            {interval.description}
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Call Time Start
              </label>
              <input
                type="time"
                value={config.callSchedule?.callTimeStart}
                onChange={(e) =>
                  handleChange("callSchedule", {
                    ...config.callSchedule,
                    callTimeStart: e.target.value,
                  })
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Call Time End
              </label>
              <input
                type="time"
                value={config.callSchedule?.callTimeEnd}
                onChange={(e) =>
                  handleChange("callSchedule", {
                    ...config.callSchedule,
                    callTimeEnd: e.target.value,
                  })
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Timezone *
              </label>
              <select
                value={config.callSchedule?.timezone || ""}
                onChange={(e) =>
                  handleChange("callSchedule", {
                    ...config.callSchedule,
                    timezone: e.target.value,
                  })
                }
                className={`w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 ${
                  errors?.timezone
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-purple-500"
                }`}
              >
                <option value="">Select timezone...</option>
                {allTimezones.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              {errors?.timezone && (
                <p className="text-red-500 text-xs mt-1">{errors.timezone}</p>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-xs text-gray-900">
                  Weekend Calling
                </h4>
                <p className="text-xs text-gray-600">Allow calls on weekends</p>
              </div>
              <button
                onClick={() =>
                  handleChange("callSchedule", {
                    ...config.callSchedule,
                    weekendCalling: !config.callSchedule?.weekendCalling,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.callSchedule?.weekendCalling
                    ? "bg-purple-600"
                    : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.callSchedule?.weekendCalling
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-xs text-gray-900">
                  Respect DND
                </h4>
                <p className="text-xs text-gray-600">
                  Respect Do Not Disturb settings
                </p>
              </div>
              <button
                onClick={() =>
                  handleChange("callSchedule", {
                    ...config.callSchedule,
                    respectDND: !config.callSchedule?.respectDND,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.callSchedule?.respectDND
                    ? "bg-purple-600"
                    : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.callSchedule?.respectDND
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-xs text-gray-900">
                  Voicemail Detection
                </h4>
                <p className="text-xs text-gray-600">
                  Detect and handle voicemail
                </p>
              </div>
              <button
                onClick={() =>
                  handleChange("callSchedule", {
                    ...config.callSchedule,
                    voicemailDetection:
                      !config.callSchedule?.voicemailDetection,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.callSchedule?.voicemailDetection
                    ? "bg-purple-600"
                    : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.callSchedule?.voicemailDetection
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {errors.callSchedule && (
            <p className="text-sm text-red-600 mt-2">{errors.callSchedule}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallLogicStep;
