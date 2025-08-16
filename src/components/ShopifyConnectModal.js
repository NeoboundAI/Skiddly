"use client";

import { useState } from "react";

const ShopifyConnectModal = ({ isOpen, onClose, onSuccess }) => {
  const [shopName, setShopName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate shop name
      if (!shopName.trim()) {
        setError("Please enter your shop name");
        return;
      }

      // Format shop name to include .myshopify.com if not present
      let formattedShop = shopName.trim().toLowerCase();
      if (!formattedShop.includes(".myshopify.com")) {
        formattedShop = `${formattedShop}.myshopify.com`;
      }

      // Call the connect API
      const response = await fetch("/api/shopify/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shop: formattedShop }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to connect to Shopify");
      }

      // Redirect to Shopify authorization
      window.location.href = data.authUrl;
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
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
              viewBox="-18 0 292 292"
            >
              <path
                fill="#95BF46"
                d="M223.774 57.34c-.201-1.46-1.48-2.268-2.537-2.357a19614 19614 0 0 0-23.383-1.743s-15.507-15.395-17.209-17.099c-1.703-1.703-5.029-1.185-6.32-.805-.19.056-3.388 1.043-8.678 2.68-5.18-14.906-14.322-28.604-30.405-28.604-.444 0-.901.018-1.358.044C129.31 3.407 123.644.779 118.75.779c-37.465 0-55.364 46.835-60.976 70.635-14.558 4.511-24.9 7.718-26.221 8.133-8.126 2.549-8.383 2.805-9.45 10.462C21.3 95.806.038 260.235.038 260.235l165.678 31.042 89.77-19.42S223.973 58.8 223.775 57.34zM156.49 40.848l-14.019 4.339c.005-.988.01-1.96.01-3.023 0-9.264-1.286-16.723-3.349-22.636 8.287 1.04 13.806 10.469 17.358 21.32zm-27.638-19.483c2.304 5.773 3.802 14.058 3.802 25.238 0 .572-.005 1.095-.01 1.624-9.117 2.824-19.024 5.89-28.953 8.966 5.575-21.516 16.025-31.908 25.161-35.828zm-11.131-10.537c1.617 0 3.246.549 4.805 1.622-12.007 5.65-24.877 19.88-30.312 48.297l-22.886 7.088C75.694 46.16 90.81 10.828 117.72 10.828z"
              />
              <path
                fill="#5E8E3E"
                d="M221.237 54.983a19614 19614 0 0 0-23.383-1.743s-15.507-15.395-17.209-17.099c-.637-.634-1.496-.959-2.394-1.099l-12.527 256.233 89.762-19.418S223.972 58.8 223.774 57.34c-.201-1.46-1.48-2.268-2.537-2.357"
              />
              <path
                fill="#FFF"
                d="m135.242 104.585-11.069 32.926s-9.698-5.176-21.586-5.176c-17.428 0-18.305 10.937-18.305 13.693 0 15.038 39.2 20.8 39.2 56.024 0 27.713-17.577 45.558-41.277 45.558-28.44 0-42.984-17.7-42.984-17.7l7.615-25.16s14.95 12.835 27.565 12.835c8.243 0 11.596-6.49 11.596-11.232 0-19.616-32.16-20.491-32.16-52.724 0-27.129 19.472-53.382 58.778-53.382 15.145 0 22.627 4.338 22.627 4.338"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">
              Connect Shopify
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://help.shopify.com/en/manual/apps/private-apps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              How to Connect
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </a>
            <a
              href="https://www.shopify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              Shopify.com
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
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
        </div>

        {/* Form */}
        <form onSubmit={handleConnect} className="">
          <div className="p-6 space-y-6">
            {/* Shop Name */}
            <div className="max-w-md">
              <label
                htmlFor="shopName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Shop Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="shopName"
                  placeholder="Eg. john"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-20"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm">.myshopify.com</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter your shop name without the .myshopify.com extension
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                What happens next?
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• You'll be redirected to Shopify to authorize the app</li>
                <li>• We'll request access to read your products and orders</li>
                <li>
                  • Your shop data will be securely synced to our platform
                </li>
              </ul>
            </div>
          </div>

          {/* Buttons */}
          <div className="bg-slate-100 flex items-center justify-between p-6">
            <button
              type="submit"
              disabled={isLoading || !shopName.trim()}
              className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
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
                  Connecting...
                </>
              ) : (
                <>
                  Connect
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm font-medium">
                Don't have an account
              </span>
              <a
                href="https://www.shopify.com/free-trial"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                Create Shopify Account
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopifyConnectModal;
