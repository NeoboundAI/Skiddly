"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ShopifyConnectModal from "@/components/ShopifyConnectModal";
import TwilioImportForm from "@/app/(protected)/integration/twilio/ImportForm";
import Toast from "@/components/Toast";
import { FiShoppingBag, FiPhone, FiUser, FiBox } from "react-icons/fi";

// Card icon backgrounds
const ICON_BG = {
  green: "bg-green-100 text-green-600",
  red: "bg-red-100 text-red-600",
  purple: "bg-purple-100 text-purple-600",
};

const DashboardPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [showShopifyModal, setShowShopifyModal] = useState(false);
  const [showTwilioModal, setShowTwilioModal] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    type: "info",
    isVisible: false,
  });
  const [onboardingSteps, setOnboardingSteps] = useState([
    {
      id: 1,
      title: "Connect Shopify",
      icon: FiShoppingBag,
      color: "green",
      description: "Link your store to start syncing data",
      completed: false,
    },
    {
      id: 2,
      title: "Connect Twilio",
      icon: FiPhone,
      color: "red",
      description: "Set up your phone system for calls",
      completed: false,
    },
    {
      id: 3,
      title: "Choose Agent",
      icon: FiUser,
      color: "purple",
      description: "Select your AI assistant personality",
      completed: false,
    },
  ]);

  // Update onboarding steps based on session data
  useEffect(() => {
    if (session?.user) {
      setOnboardingSteps((prev) =>
        prev.map((step) => {
          if (step.id === 1) {
            return {
              ...step,
              completed: session.user.shopify?.isActive || false,
            };
          }
          if (step.id === 2) {
            return {
              ...step,
              completed: session.user.twilio?.isActive || false,
            };
          }
          return step;
        })
      );
    }
  }, [session]);

  // Check for URL parameters for success/error messages from Shopify OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const error = urlParams.get("error");

    if (success === "shopify_connected") {
      setOnboardingSteps((prev) =>
        prev.map((step) => {
          if (step.id === 1) {
            return { ...step, completed: true };
          }
          return step;
        })
      );
      setToast({
        message: "Shopify connected successfully!",
        type: "success",
        isVisible: true,
      });
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (error) {
      let errorMessage = "An error occurred during Shopify connection.";

      switch (error) {
        case "invalid_state":
          errorMessage =
            "Connection session expired. Please try connecting again.";
          break;
        case "shopify_auth_denied":
          errorMessage = "Shopify authorization was denied. Please try again.";
          break;
        case "invalid_callback_params":
          errorMessage = "Invalid connection parameters. Please try again.";
          break;
        case "token_exchange_failed":
          errorMessage =
            "Failed to complete Shopify connection. Please try again.";
          break;
        case "connection_exists":
          errorMessage = "Shopify is already connected to another account.";
          break;
        default:
          errorMessage = `Connection error: ${error}`;
      }

      console.error("Shopify connection error:", errorMessage);
      setToast({
        message: errorMessage,
        type: "error",
        isVisible: true,
      });

      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleTwilioConnect = async (credentials) => {
    try {
      // Here you would typically make an API call to save the credentials
      console.log("Connecting Twilio with credentials:", credentials);

      // For now, just update the status
      setOnboardingSteps((prev) =>
        prev.map((step) => {
          if (step.id === 2) {
            return { ...step, completed: true };
          }
          return step;
        })
      );

      setToast({
        message: "Twilio connected successfully!",
        type: "success",
        isVisible: true,
      });
    } catch (error) {
      console.error("Error connecting Twilio:", error);
      setToast({
        message: "Failed to connect Twilio. Please try again.",
        type: "error",
        isVisible: true,
      });
    }
  };

  // Card design similar to /integration page
  function OnboardingCard({ step, onAction }) {
    const Icon = step.icon;
    return (
      <div
        className={`relative flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm p-6 transition-all ${
          step.completed ? "ring-2 ring-green-400" : "hover:shadow-md"
        }`}
      >
        <div className="flex items-center gap-4 mb-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-white shadow ${ICON_BG[step.color]}`}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {step.title}
              </h3>
              {step.completed && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                  Connected
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{step.description}</p>
          </div>
        </div>
        <div className="flex-1" />
        <button
          onClick={onAction}
          className={`mt-4 w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            step.completed
              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
              : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          {step.completed ? "Manage" : "Connect"}
        </button>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Home</h1>
          <div className="flex items-center space-x-2">
            <p className="text-lg text-gray-700">
              Hi {session?.user?.name?.split(" ")[0] || "User"}!
            </p>
            <p className="text-gray-500">Start setting up your store</p>
          </div>
        </div>

        {/* Onboarding Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {onboardingSteps.map((step) => (
            <OnboardingCard
              key={step.id}
              step={step}
              onAction={() => {
                if (step.id === 1) {
                  if (step.completed) {
                    router.push("/integration");
                  } else {
                    setShowShopifyModal(true);
                  }
                } else if (step.id === 2) {
                  if (step.completed) {
                    router.push("/integration");
                  } else {
                    setShowTwilioModal(true);
                  }
                }
              }}
            />
          ))}
        </div>

        {/* Bottom Section */}
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-200 rounded-lg mx-auto mb-6 flex items-center justify-center">
            <FiBox className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-lg text-gray-700 font-medium">
            Good things coming your way! Complete setting up your store to start
            calling your abandoned leads.
          </p>
        </div>
      </div>

      {/* Shopify Connect Modal */}
      <ShopifyConnectModal
        isOpen={showShopifyModal}
        onClose={() => setShowShopifyModal(false)}
        onSuccess={() => {
          setShowShopifyModal(false);
          setOnboardingSteps((prev) =>
            prev.map((step) => {
              if (step.id === 1) {
                return { ...step, completed: true };
              }
              return step;
            })
          );
        }}
      />

      {/* Twilio Connect Modal */}
      <TwilioImportForm
        isOpen={showTwilioModal}
        onClose={() => setShowTwilioModal(false)}
        onConnect={handleTwilioConnect}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </DashboardLayout>
  );
};

export default DashboardPage;
