import { useState } from "react";
import BigButton from "./ui/Button";

export default function WebhookRemovalButton({ shop, accessToken }) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const removeWebhooks = async () => {
    if (
      !confirm(
        "Are you sure you want to remove all webhooks? This will stop real-time notifications from Shopify."
      )
    ) {
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/shopify/remove-webhooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shop,
          accessToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          type: "success",
          message: data.message,
          details: data.removedWebhooks,
          totalFound: data.totalFound,
          totalRemoved: data.totalRemoved,
        });
      } else {
        setResult({
          type: "error",
          message: data.error,
        });
      }
    } catch (error) {
      setResult({
        type: "error",
        message: "Failed to remove webhooks: " + error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <BigButton
        onClick={removeWebhooks}
        disabled={isLoading || !shop || !accessToken}
        className="w-full bg-red-600 hover:bg-red-700 text-white"
      >
        {isLoading ? "Removing Webhooks..." : "Remove All Webhooks"}
      </BigButton>

      {result && (
        <div
          className={`p-4 rounded-lg ${
            result.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <h4 className="font-semibold mb-2">
            {result.type === "success" ? "Success" : "Error"}
          </h4>
          <p className="text-sm">{result.message}</p>

          {result.details && (
            <div className="mt-3">
              <h5 className="font-medium text-sm mb-2">Removal Details:</h5>
              <div className="space-y-1">
                {result.details.map((webhook, index) => (
                  <div key={index} className="text-xs">
                    <span className="font-medium">{webhook.topic}:</span>{" "}
                    <span
                      className={
                        webhook.status === "removed"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {webhook.status}
                    </span>
                    {webhook.id && (
                      <div className="text-gray-600 ml-2">ID: {webhook.id}</div>
                    )}
                    {webhook.error && (
                      <div className="text-red-500 ml-2">
                        Error: {webhook.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.totalFound !== undefined && (
            <div className="mt-2 text-xs">
              <strong>Summary:</strong> Found {result.totalFound} webhooks,
              removed {result.totalRemoved} successfully.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
