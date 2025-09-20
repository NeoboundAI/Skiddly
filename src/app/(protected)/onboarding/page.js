"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import PlanSelector from "../../../components/PlanSelector";

const OnboardingPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const steps = [
    {
      id: 0,
      title: "Hello There!",
      subtitle: "Welcome to your new journey with Skiddly",
      type: "greeting",
    },
    {
      id: 1,
      title: "Welcome to",
      subtitle: "Skiddly",
      type: "brand",
    },
    {
      id: 2,
      title: "Choose Your Plan",
      subtitle: "Select a plan that fits your needs",
      type: "plan-selection",
    },
    {
      id: 3,
      title: "Setup your store first",
      subtitle:
        "Let's get everything connected so you can start making calls right away",
      type: "setup",
      items: [
        "Connect Shopify",
        "Connect Twilio",
        "Choose Agent",
        "Start Calling",
      ],
    },
  ];

  useEffect(() => {
    // Auto-advance through steps with delays
    const timers = [];

    timers.push(setTimeout(() => setCurrentStep(1), 2000)); // Show "Welcome to" after 2s
    timers.push(setTimeout(() => setCurrentStep(2), 4000)); // Show plan selection after 4s

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  const handlePlanSelect = async (planId) => {
    try {
      setIsCompleting(true);
      setSelectedPlan(planId);

      // Update user plan in the database
      const response = await fetch("/api/auth/update-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: planId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update plan");
      }

      // Move to next step
      setCurrentStep(3);
    } catch (error) {
      console.error("Error updating plan:", error);
      alert("Failed to update plan. Please try again.");
    } finally {
      setIsCompleting(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      setIsCompleting(true);
      const response = await fetch("/api/auth/complete-onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to complete onboarding");
      }

      const data = await response.json();
      console.log("Onboarding completed:", data);

      // Force session refresh to get updated onboarding status
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error completing onboarding:", error);
      alert("Failed to complete onboarding. Please try again.");
    } finally {
      setIsCompleting(false);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-purple-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full ">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center"
          >
            {currentStepData.type === "greeting" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.h1
                  className="text-4xl font-bold text-purple-600 mb-4"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  Hello There!
                </motion.h1>
              </motion.div>
            )}

            {currentStepData.type === "brand" && (
              <motion.div
                className="flex items-center justify-center flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.p
                  className="text-base text-[#64748B] uppercase tracking-wider font-medium mb-0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  WELCOME TO
                </motion.p>

                <img src="/skiddly.svg" className="w-60 h-30 -mt-2" />
              </motion.div>
            )}

            {currentStepData.type === "plan-selection" && (
              <PlanSelector
                onPlanSelect={handlePlanSelect}
                isLoading={isCompleting}
              />
            )}

            {currentStepData.type === "setup" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className=" w-full p-6 max-w-xl m-auto"
              >
                <motion.h1
                  className="text-3xl font-bold text-purple-600 mb-8 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Setup your account
                </motion.h1>

                <div className="flex justify-between items-center mb-8 px-4">
                  {currentStepData.items.map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex flex-col items-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <motion.div
                        className="w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center text-sm font-bold mb-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 0.7 + index * 0.1,
                          type: "spring",
                          stiffness: 200,
                        }}
                      >
                        {index + 1}
                      </motion.div>
                      <span className="text-sm text-gray-700 text-center whitespace-nowrap">
                        {item}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="flex justify-center"
                >
                  <button
                    onClick={completeOnboarding}
                    disabled={isCompleting}
                    className="bg-gray-800 text-white py-3 px-8 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium "
                  >
                    {isCompleting ? "Completing setup..." : "Continue"}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingPage;
