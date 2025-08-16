"use client";

import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/DashboardLayout";
import { FiShoppingBag, FiPhone, FiUser, FiBox } from "react-icons/fi";

const DashboardPage = () => {
  const { data: session } = useSession();

  const onboardingSteps = [
    {
      id: 1,
      title: "Connect Shopify",
      icon: FiShoppingBag,
      color: "green",
      description: "Link your store to start syncing data",
    },
    {
      id: 2,
      title: "Connect Twilio",
      icon: FiPhone,
      color: "red",
      description: "Set up your phone system for calls",
    },
    {
      id: 3,
      title: "Choose Agent",
      icon: FiUser,
      color: "purple",
      description: "Select your AI assistant personality",
    },
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case "green":
        return "bg-green-50 border-green-200 text-green-800";
      case "red":
        return "bg-red-50 border-red-200 text-red-800";
      case "purple":
        return "bg-purple-50 border-purple-200 text-purple-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

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
          {onboardingSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`p-6 rounded-lg border shadow-sm ${getColorClasses(
                  step.color
                )}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        step.color === "green"
                          ? "bg-green-100"
                          : step.color === "red"
                          ? "bg-red-100"
                          : "bg-purple-100"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          step.color === "green"
                            ? "text-green-600"
                            : step.color === "red"
                            ? "text-red-600"
                            : "text-purple-600"
                        }`}
                      />
                    </div>
                    <span className="font-semibold">
                      {step.id}. {step.title}
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                    Continue
                  </button>
                </div>
                <p className="text-sm opacity-80">{step.description}</p>
              </div>
            );
          })}
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
    </DashboardLayout>
  );
};

export default DashboardPage;
