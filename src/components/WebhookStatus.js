import { useState, useEffect } from "react";
import WebhookRegistrationButton from "./WebhookRegistrationButton";
import WebhookRemovalButton from "./WebhookRemovalButton";
import useShopStore from "@/stores/shopStore";

export default function WebhookStatus({ user }) {
  const { selectedShop } = useShopStore();
  const [showManualRegistration, setShowManualRegistration] = useState(false);

  // Use selected shop from context
  const webhooksRegistered = selectedShop?.webhooksRegistered;
  const registeredWebhooks = selectedShop?.registeredWebhooks || [];
  const webhookRegistrationDate = selectedShop?.webhookRegistrationDate;

  const getStatusColor = (status) => {
    switch (status) {
      case "registered":
      case "already_registered":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      case "skipped":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "registered":
      case "already_registered":
        return "✅";
      case "failed":
        return "❌";
      case "skipped":
        return "⚠️";
      default:
        return "❓";
    }
  };

  if (!selectedShop) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Shopify Webhook Status
        </h3>
        <p className="text-gray-500">
          Please select a shop to view webhook status.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Shopify Webhook Status
        </h3>
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            webhooksRegistered
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {webhooksRegistered ? "Active" : "Inactive"}
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Connected shop: {selectedShop.shop}
      </p>

      {webhookRegistrationDate && (
        <p className="text-sm text-gray-600 mb-4">
          Last updated: {new Date(webhookRegistrationDate).toLocaleString()}
        </p>
      )}

      {registeredWebhooks.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Registered Webhooks:</h4>
          {registeredWebhooks.map((webhook, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <span>{getStatusIcon(webhook.status)}</span>
                <span className="font-medium text-sm">{webhook.topic}</span>
              </div>
              <span className={`text-sm ${getStatusColor(webhook.status)}`}>
                {webhook.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No webhooks registered yet.</p>
      )}

      {!webhooksRegistered && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">
                Webhooks Not Registered
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Webhook registration failed during initial setup. You can
                manually register webhooks to enable real-time abandoned cart
                tracking.
              </p>
              <div className="mt-3">
                <button
                  onClick={() =>
                    setShowManualRegistration(!showManualRegistration)
                  }
                  className="text-sm text-yellow-800 hover:text-yellow-900 underline"
                >
                  {showManualRegistration ? "Hide" : "Show"} Manual Registration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showManualRegistration && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">
            Manual Webhook Registration
          </h4>
          <WebhookRegistrationButton
            shop={selectedShop?.shop}
            accessToken={selectedShop?.accessToken}
          />
        </div>
      )}

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Webhook Management</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Register Webhooks
            </h5>
            <WebhookRegistrationButton
              shop={selectedShop?.shop}
              accessToken={selectedShop?.accessToken}
            />
          </div>
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Remove Webhooks
            </h5>
            <WebhookRemovalButton
              shop={selectedShop?.shop}
              accessToken={selectedShop?.accessToken}
            />
          </div>
        </div>
      </div>

      {webhooksRegistered && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-green-400">✅</span>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-800">
                Webhooks Active
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Your Shopify webhooks are properly configured and active. You'll
                receive real-time notifications for abandoned carts and new
                orders.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
