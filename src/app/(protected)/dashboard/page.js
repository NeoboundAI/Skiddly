"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

import ShopifyConnectModal from "@/components/ShopifyConnectModal";
import TwilioImportForm from "@/app/(protected)/integration/twilio/ImportForm";
import Toast from "@/components/Toast";
import { FiShoppingBag, FiPhone, FiUser, FiBox } from "react-icons/fi";
import useShopStore from "@/stores/shopStore";
import { useShopConnection } from "@/hooks/useShops";

// Card icon backgrounds
const ICON_BG = {
  green: "bg-green-100 text-green-600",
  red: "bg-red-100 text-red-600",
  purple: "bg-purple-100 text-purple-600",
};

const DashboardPage = () => {
  const { data: session } = useSession();
  const { selectedShop } = useShopStore();
  const { updateShopsAfterConnection } = useShopConnection();
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
      icon: "/shopify.svg",
      color: "green",
      description: "Link your store to start syncing data",
      completed: false,
    },
    {
      id: 2,
      title: "Connect Twilio",
      icon: "/twilio.svg",
      color: "red",
      description: "Set up your phone system for calls",
      completed: false,
    },
    {
      id: 3,
      title: "Choose Agent",
      icon: "/usericon.svg",
      color: "purple",
      description: "Select your AI assistant personality",
      completed: false,
    },
  ]);

  // Update onboarding steps based on session data and shop context
  useEffect(() => {
    if (session?.user) {
      const hasShopifyConnection = !!selectedShop;

      setOnboardingSteps((prev) =>
        prev.map((step) => {
          if (step.id === 1) {
            return {
              ...step,
              completed: hasShopifyConnection,
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
  }, [session, selectedShop]);

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

      // Check if webhook registration was skipped
      const webhookSkipped = urlParams.get("webhook_skipped");

      if (webhookSkipped === "true") {
        setToast({
          message:
            "Shopify connected! Webhooks skipped in development. Set WEBHOOK_URL for full functionality.",
          type: "warning",
          isVisible: true,
        });
      } else {
        setToast({
          message: "Shopify connected successfully!",
          type: "success",
          isVisible: true,
        });
      }

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
    return (
      <div
        className={`flex p-4 items-center justify-between bg-[#F9FAFB] border border-[#D0D5DD] rounded-lg  mb-2 transition-all ${
          step.completed ? "ring-2 ring-green-400" : "hover:shadow-sm"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-4 rounded-full  flex items-center justify-center text-xl font-bold border border-[#EAECF0] ${
              step.completed ? "bg-[#F2F4F7]" : "bg-white"
            }`}
          >
            <img src={step.icon} alt={step.title} className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-medium text-[#101828]">
                {step.id}.
              </span>
              <span className="text-base font-semibold text-[#101828]">
                {step.title}
              </span>
              {step.completed && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                  Connected
                </span>
              )}
            </div>
            {/* Optionally, you can show description here if needed */}
            {/* <p className="text-xs text-gray-500">{step.description}</p> */}
          </div>
        </div>
        <button
          onClick={onAction}
          disabled={step.completed}
          className={`ml-4 px-4 py-2 rounded  text-sm font-medium transition-colors ${
            step.completed
              ? "bg-[#F2F4F7] text-[#101828] cursor-not-allowed"
              : "bg-[#101828] text-white hover:bg-[#1A1A2E] cursor-pointer"
          }`}
          style={{ minWidth: 80 }}
        >
          {step.completed ? "Completed" : "Continue"}
        </button>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl border-b border-[#EAECF0] font-semibold text-[#000000] pb-4 mb-4">
            Home
          </h1>
          <div className="flex items-left flex-col justify-center space-x-2">
            <p className="text-2xl text-[#000000] font-semibold">
              Hi {session?.user?.name?.split(" ")[0] || "User"}!
            </p>
            <p className="text-[#667085] text-base font-medium">
              Start setting up your store
            </p>
          </div>
        </div>

        {/* Onboarding Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
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
                } else if (step.id === 3) {
                  router.push("/agent");
                }
              }}
            />
          ))}
        </div>

        {/* Bottom Section */}
        <div className="text-center py-12">
          <div className="w-24 h-24  rounded-lg mx-auto mb-6 flex items-center justify-center">
            <img
              src="/dropbox.png"
              alt="goodthings"
              className="w-[104px] h-[104px]"
            />
          </div>
          <p className="text-2xl text-[#020617] font-semibold mb-2">
            Good things coming your way!
          </p>
          <p className="text-base text-[#667085] font-medium mb-6">
            Complete setting up your store to start calling your abandoned
            leads.
          </p>
        </div>
      </div>

      {/* Shopify Connect Modal */}
      <ShopifyConnectModal
        isOpen={showShopifyModal}
        onClose={() => setShowShopifyModal(false)}
        onSuccess={() => {
          setShowShopifyModal(false);
          updateShopsAfterConnection();
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
