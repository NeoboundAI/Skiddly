"use client";

import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiShoppingBag, FiPlus } from "react-icons/fi";
import useShopStore from "@/stores/shopStore";
import { useShops, useShopConnection } from "@/hooks/useShops";
import ShopifyConnectModal from "./ShopifyConnectModal";

const ShopSelector = ({ isCollapsed }) => {
  const { selectedShop, setSelectedShop } = useShopStore();
  const { data: shops = [], isLoading: loading } = useShops();
  const { updateShopsAfterConnection } = useShopConnection();
  const [isOpen, setIsOpen] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const dropdownRef = useRef(null);

  // Auto-select first shop if no shop is selected and shops are available
  useEffect(() => {
    if (shops && shops.length > 0) {
      if (!selectedShop) {
        setSelectedShop(shops[0]);
      }
    } else if (shops && shops.length === 0) {
      // Clear selected shop if no shops are available
      if (selectedShop) {
        setSelectedShop(null);
      }
    }
  }, [shops, selectedShop, setSelectedShop]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleShopSelect = (shop) => {
    setSelectedShop(shop);
    setIsOpen(false);
  };

  const formatShopName = (shopDomain) => {
    // Remove .myshopify.com and format nicely
    return shopDomain.replace(".myshopify.com", "").replace(/-/g, " ");
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="p-4">
        <button
          onClick={() => setShowConnectModal(true)}
          className={`w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ${
            isCollapsed ? "px-2" : "px-4"
          }`}
        >
          <FiPlus className="w-4 h-4" />
          {!isCollapsed && <span>Connect Shop</span>}
        </button>

        <ShopifyConnectModal
          isOpen={showConnectModal}
          onClose={() => setShowConnectModal(false)}
          onSuccess={() => {
            setShowConnectModal(false);
            updateShopsAfterConnection();
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-4" ref={dropdownRef}>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between bg-white border border-gray-300 rounded-lg p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ${
            isCollapsed ? "px-2" : "px-4"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <FiShoppingBag className="w-4 h-4 text-green-600 flex-shrink-0" />
            {!isCollapsed && (
              <span className="truncate">
                {selectedShop
                  ? formatShopName(selectedShop.shop)
                  : "Select Shop"}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <FiChevronDown
              className={`w-4 h-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </button>

        {isOpen && !isCollapsed && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            <div className="p-2">
              {shops.map((shop) => (
                <button
                  key={shop.shop}
                  onClick={() => handleShopSelect(shop)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                    selectedShop?.shop === shop.shop
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FiShoppingBag className="w-4 h-4 text-green-600" />
                  <span className="truncate">{formatShopName(shop.shop)}</span>
                  {selectedShop?.shop === shop.shop && (
                    <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </button>
              ))}

              <div className="border-t border-gray-200 mt-2 pt-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowConnectModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Add Another Shop</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ShopifyConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={() => {
          setShowConnectModal(false);
          updateShopsAfterConnection();
        }}
      />
    </div>
  );
};

export default ShopSelector;
