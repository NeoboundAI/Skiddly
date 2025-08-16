"use client";

import type React from "react";

import { useState } from "react";
import TwilioImportForm from "./twilio/ImportForm";

type IntegrationStatus = "connected" | "disconnected" | "coming-soon";

interface Integration {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  icon: React.ReactNode;
}

const TwilioIcon = () => (
  <svg
    className="w-6 h-6"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    viewBox="0 0 256 256"
  >
    <path
      fill="#F12E45"
      d="M128 0c70.656 0 128 57.344 128 128s-57.344 128-128 128S0 198.656 0 128 57.344 0 128 0Zm0 33.792c-52.224 0-94.208 41.984-94.208 94.208S75.776 222.208 128 222.208s94.208-41.984 94.208-94.208S180.224 33.792 128 33.792Zm31.744 99.328c14.704 0 26.624 11.92 26.624 26.624 0 14.704-11.92 26.624-26.624 26.624-14.704 0-26.624-11.92-26.624-26.624 0-14.704 11.92-26.624 26.624-26.624Zm-63.488 0c14.704 0 26.624 11.92 26.624 26.624 0 14.704-11.92 26.624-26.624 26.624-14.704 0-26.624-11.92-26.624-26.624 0-14.704 11.92-26.624 26.624-26.624Zm63.488-63.488c14.704 0 26.624 11.92 26.624 26.624 0 14.704-11.92 26.624-26.624 26.624-14.704 0-26.624-11.92-26.624-26.624 0-14.704 11.92-26.624 26.624-26.624Zm-63.488 0c14.704 0 26.624 11.92 26.624 26.624 0 14.704-11.92 26.624-26.624 26.624-14.704 0-26.624-11.92-26.624-26.624 0-14.704 11.92-26.624 26.624-26.624Z"
    />
  </svg>
);

const ShopifyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
    preserveAspectRatio="xMidYMid"
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
);

const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 32 32"
  >
    <path
      fill="#BFC8D0"
      fillRule="evenodd"
      d="M16 31c7.732 0 14-6.268 14-14S23.732 3 16 3 2 9.268 2 17c0 2.51.661 4.867 1.818 6.905L2 31l7.315-1.696A13.938 13.938 0 0 0 16 31Zm0-2.154c6.543 0 11.846-5.303 11.846-11.846 0-6.542-5.303-11.846-11.846-11.846C9.458 5.154 4.154 10.458 4.154 17c0 2.526.79 4.867 2.138 6.79L5.23 27.77l4.049-1.013a11.791 11.791 0 0 0 6.72 2.09Z"
      clipRule="evenodd"
    />
    <path
      fill="url(#a)"
      d="M28 16c0 6.627-5.373 12-12 12-2.528 0-4.873-.782-6.807-2.116L5.09 26.909l1.075-4.03A11.945 11.945 0 0 1 4 16C4 9.373 9.373 4 16 4s12 5.373 12 12Z"
    />
    <path
      fill="#fff"
      fillRule="evenodd"
      d="M16 30c7.732 0 14-6.268 14-14S23.732 2 16 2 2 8.268 2 16c0 2.51.661 4.867 1.818 6.905L2 30l7.315-1.696A13.938 13.938 0 0 0 16 30Zm0-2.154c6.543 0 11.846-5.303 11.846-11.846 0-6.542-5.303-11.846-11.846-11.846C9.458 4.154 4.154 9.458 4.154 16c0 2.526.79 4.867 2.138 6.79L5.23 26.77l4.049-1.013a11.791 11.791 0 0 0 6.72 2.09Z"
      clipRule="evenodd"
    />
    <path
      fill="#fff"
      d="M12.5 9.5c-.333-.669-.844-.61-1.36-.61-.921 0-2.359 1.105-2.359 3.16 0 1.684.742 3.528 3.243 6.286 2.414 2.662 5.585 4.039 8.218 3.992 2.633-.047 3.175-2.313 3.175-3.078 0-.339-.21-.508-.356-.554-.897-.43-2.552-1.233-2.928-1.384-.377-.15-.573.054-.695.165-.342.325-1.019 1.284-1.25 1.5-.232.215-.578.106-.721.024-.53-.212-1.964-.85-3.107-1.958-1.415-1.371-1.498-1.843-1.764-2.263-.213-.336-.057-.542.021-.632.305-.351.726-.894.914-1.164.189-.27.04-.679-.05-.934-.387-1.097-.715-2.015-.981-2.55Z"
    />
    <defs>
      <linearGradient
        id="a"
        x1={26.5}
        x2={4}
        y1={7}
        y2={28}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#5BD066" />
        <stop offset={1} stopColor="#27B43E" />
      </linearGradient>
    </defs>
  </svg>
);

interface IntegrationCardProps {
  integration: Integration;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
}

const IntegrationCard = ({
  integration,
  onConnect,
  onDisconnect,
}: IntegrationCardProps) => {
  const isConnected = integration.status === "connected";
  const isComingSoon = integration.status === "coming-soon";

  const cardClasses = isConnected
    ? "relative bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm"
    : "relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm";

  const renderActionButton = () => {
    if (isComingSoon) {
      return (
        <span className="bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
          COMING SOON
        </span>
      );
    }

    if (isConnected) {
      return (
        <button
          onClick={() => onDisconnect(integration.id)}
          className="p-2 hover:bg-green-100 rounded-md transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      );
    }

    return (
      <button
        onClick={() => onConnect(integration.id)}
        className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Connect Now
      </button>
    );
  };

  return (
    <div className={cardClasses}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center">
            {integration.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {integration.name}
              </h3>
              {isConnected && (
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>
        {renderActionButton()}
      </div>
      <p className="text-sm text-gray-600">{integration.description}</p>
    </div>
  );
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "twilio",
      name: "Twilio",
      description:
        "Connect and manage phone numbers for calls, messages, or verifications via API.",
      status: "disconnected",
      icon: <TwilioIcon />,
    },
    {
      id: "shopify",
      name: "Shopify",
      description:
        "Import store data like products, orders, and customers using Shopify APIs.",
      status: "disconnected",
      icon: <ShopifyIcon />,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      description:
        "Send automated nudges and reminders to users through WhatsApp Business API.",
      status: "coming-soon",
      icon: <WhatsAppIcon />,
    },
  ]);

  const [showTwilioForm, setShowTwilioForm] = useState(false);

  const handleConnect = (id: string) => {
    if (id === "twilio") {
      setShowTwilioForm(true);
    } else {
      setIntegrations((prev) =>
        prev.map((integration) =>
          integration.id === id
            ? { ...integration, status: "connected" as IntegrationStatus }
            : integration
        )
      );
    }
  };

  const handleDisconnect = (id: string) => {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id
          ? { ...integration, status: "disconnected" as IntegrationStatus }
          : integration
      )
    );
  };

  const handleTwilioConnect = async (credentials: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  }) => {
    // Here you would typically make an API call to save the credentials
    console.log("Connecting Twilio with credentials:", credentials);

    // For now, just update the status
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === "twilio"
          ? { ...integration, status: "connected" as IntegrationStatus }
          : integration
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Integrations</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
      </div>

      {/* Twilio Import Form Modal */}
      <TwilioImportForm
        isOpen={showTwilioForm}
        onClose={() => setShowTwilioForm(false)}
        onConnect={handleTwilioConnect}
      />
    </div>
  );
}
