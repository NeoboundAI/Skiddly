import { useState } from "react";
import BigButton from "./ui/Button";

export default function WebhookRegistrationButton({ shop, accessToken }) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const registerWebhooks = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/shopify/register-webhooks", {
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
          details: data.registeredWebhooks,
          webhookUrl: data.webhookUrl,
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
        message: "Failed to register webhooks: " + error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <BigButton
        onClick={registerWebhooks}
        disabled={isLoading || !shop || !accessToken}
        className="w-full"
      >
        {isLoading ? "Registering Webhooks..." : "Register Webhooks"}
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

          {result.webhookUrl && (
            <div className="mt-2 text-xs">
              <strong>Webhook URL:</strong> {result.webhookUrl}
            </div>
          )}

          {result.details && (
            <div className="mt-3">
              <h5 className="font-medium text-sm mb-2">Webhook Details:</h5>
              <div className="space-y-1">
                {result.details.map((webhook, index) => (
                  <div key={index} className="text-xs">
                    <span className="font-medium">{webhook.topic}:</span>{" "}
                    <span
                      className={
                        webhook.status === "registered" ||
                        webhook.status === "already_registered"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {webhook.status}
                    </span>
                    {webhook.webhookId && (
                      <div className="text-gray-600 ml-2">
                        ID: {webhook.webhookId}
                      </div>
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
        </div>
      )}
    </div>
  );
}
