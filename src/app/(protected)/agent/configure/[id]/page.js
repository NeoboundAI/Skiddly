"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/DashboardLayout";
import ShopifyAIAgentBuilder from "@/components/ShopifyAIAgentBuilder";
import { useVapiAssistant, useCreateVapiAssistant } from "@/hooks/useVapi";
import useShopStore from "@/stores/shopStore";
import axios from "axios";

const AgentConfigurePage = () => {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { selectedShop } = useShopStore();

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mutations
  const createVapiAssistant = useCreateVapiAssistant();

  // Fetch agent data
  useEffect(() => {
    if (params.id && status === "authenticated") {
      fetchAgent();
    }
  }, [params.id, status]);

  const fetchAgent = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/agents/${params.id}`);
      if (response.data.success) {
        setAgent(response.data.data);
      } else {
        setError("Failed to fetch agent");
      }
    } catch (error) {
      console.error("Error fetching agent:", error);
      setError("Failed to fetch agent");
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  // Redirect if no shop is selected
  useEffect(() => {
    if (status === "authenticated" && !selectedShop) {
      router.push("/dashboard");
    }
  }, [status, selectedShop, router]);

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error Loading Agent
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push("/agent")}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Back to Agents
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedShop) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Shop Selected
            </h2>
            <p className="text-gray-600 mb-4">
              Please select a Shopify shop to configure your agent.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Agent Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              The agent you're looking for doesn't exist.
            </p>
            <button
              onClick={() => router.push("/agent")}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Back to Agents
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ShopifyAIAgentBuilder
        initialConfig={agent.configuration}
        selectedShop={selectedShop}
        agentId={agent._id}
        onCreateAgent={async (agentConfig) => {
          try {
            console.log("🚀 Starting agent update process...");
            console.log("📋 Agent Config:", agentConfig);
            console.log("🏪 Selected Shop:", selectedShop);
            console.log("🆔 Agent ID:", agent._id);

            // Create VAPI assistant with cleaned data
            console.log("🔧 Creating VAPI assistant...");

            // Use the agent's VAPI configuration as template
            let systemPrompt =
              agent.vapiConfiguration?.model?.messages?.[0]?.content || "";

            // Replace template placeholders with actual values
            systemPrompt = systemPrompt
              .replace(/{{Agent Name}}/g, agentConfig.agentName || "Sarah")
              .replace(/{{Customer Name}}/g, "there")
              .replace(/Culaterline/g, agentConfig.storeName || "your store")
              .replace(
                /culaterline\.myshopify\.com/g,
                agentConfig.storeName || "your store"
              );

            // Replace customized responses if they exist
            if (agentConfig.objectionHandling) {
              // Incentive Offering
              if (
                agentConfig.objectionHandling.incentiveOfferingMode ===
                  "custom" &&
                agentConfig.objectionHandling.incentiveOfferingCustom
              ) {
                systemPrompt = systemPrompt.replace(
                  /Incentive Offering \(When Appropriate\):\s*"[^"]*"/,
                  `Incentive Offering (When Appropriate):\n"${agentConfig.objectionHandling.incentiveOfferingCustom}"`
                );
              }

              // Order Completion Assistance
              if (
                agentConfig.objectionHandling.orderCompletionMode ===
                  "custom" &&
                agentConfig.objectionHandling.orderCompletionCustom
              ) {
                systemPrompt = systemPrompt.replace(
                  /Order Completion Assistance:\s*"[^"]*"/,
                  `Order Completion Assistance:\n"${agentConfig.objectionHandling.orderCompletionCustom}"`
                );
              }

              // Alternative if Not Ready Now
              if (
                agentConfig.objectionHandling.alternativeNotReadyMode ===
                  "custom" &&
                agentConfig.objectionHandling.alternativeNotReadyCustom
              ) {
                systemPrompt = systemPrompt.replace(
                  /Alternative if Not Ready Now:\s*"[^"]*"/,
                  `Alternative if Not Ready Now:\n"${agentConfig.objectionHandling.alternativeNotReadyCustom}"`
                );
              }

              // If customer is busy
              if (
                agentConfig.objectionHandling.customerBusyMode === "custom" &&
                agentConfig.objectionHandling.customerBusyCustom
              ) {
                systemPrompt = systemPrompt.replace(
                  /If customer is busy:\s*"[^"]*"/,
                  `If customer is busy:\n"${agentConfig.objectionHandling.customerBusyCustom}"`
                );
              }

              // If still busy
              if (
                agentConfig.objectionHandling.stillBusyMode === "custom" &&
                agentConfig.objectionHandling.stillBusyCustom
              ) {
                systemPrompt = systemPrompt.replace(
                  /If still busy:\s*"[^"]*"/,
                  `If still busy:\n"${agentConfig.objectionHandling.stillBusyCustom}"`
                );
              }

              // If customer doesn't remember shopping
              if (
                agentConfig.objectionHandling.doesntRememberMode === "custom" &&
                agentConfig.objectionHandling.doesntRememberCustom
              ) {
                systemPrompt = systemPrompt.replace(
                  /If customer doesn't remember shopping:\s*"[^"]*"/,
                  `If customer doesn't remember shopping:\n"${agentConfig.objectionHandling.doesntRememberCustom}"`
                );
              }

              // If customer is not interested anymore
              if (
                agentConfig.objectionHandling.notInterestedMode === "custom" &&
                agentConfig.objectionHandling.notInterestedCustom
              ) {
                systemPrompt = systemPrompt.replace(
                  /If customer is not interested anymore:\s*"[^"]*"/,
                  `If customer is not interested anymore:\n"${agentConfig.objectionHandling.notInterestedCustom}"`
                );
              }

              // If customer had bad experience
              if (
                agentConfig.objectionHandling.badExperienceMode === "custom" &&
                agentConfig.objectionHandling.badExperienceCustom
              ) {
                systemPrompt = systemPrompt.replace(
                  /If customer had bad experience:\s*"[^"]*"/,
                  `If customer had bad experience:\n"${agentConfig.objectionHandling.badExperienceCustom}"`
                );
              }

              // If customer wants to think more
              if (
                agentConfig.objectionHandling.wantsToThinkMode === "custom" &&
                agentConfig.objectionHandling.wantsToThinkCustom
              ) {
                systemPrompt = systemPrompt.replace(
                  /If customer wants to think more:\s*"[^"]*"/,
                  `If customer wants to think more:\n"${agentConfig.objectionHandling.wantsToThinkCustom}"`
                );
              }

              // If customer asks about return policy
              if (
                agentConfig.objectionHandling.returnPolicyMode === "custom" &&
                agentConfig.objectionHandling.returnPolicyCustom
              ) {
                systemPrompt = systemPrompt.replace(
                  /If customer asks about return policy:\s*"[^"]*"/,
                  `If customer asks about return policy:\n"${agentConfig.objectionHandling.returnPolicyCustom}"`
                );
              }

              // If customer prefers to shop online
              if (
                agentConfig.objectionHandling.prefersOnlineMode === "custom" &&
                agentConfig.objectionHandling.prefersOnlineCustom
              ) {
                systemPrompt = systemPrompt.replace(
                  /If customer prefers to shop online:\s*"[^"]*"/,
                  `If customer prefers to shop online:\n"${agentConfig.objectionHandling.prefersOnlineCustom}"`
                );
              }
            }

            // Add discount information if available
            if (agentConfig.discountCode) {
              const discountInfo = `Offer the discount code ${
                agentConfig.discountCode
              } for ${
                agentConfig.discountPercentage || "10"
              }% off if they mention price concerns.`;
              // Add discount info to the Context section
              systemPrompt = systemPrompt.replace(
                /\[\/Context\]/,
                `\n\n${discountInfo}\n[/Context]`
              );
            }

            console.log("📝 Customized system prompt:", systemPrompt);

            const vapiAssistant = await createVapiAssistant.mutateAsync({
              name: agentConfig.agentName || "Abandoned Cart Agent",
              model: {
                provider: agent.vapiConfiguration?.model?.provider || "openai",
                model: agent.vapiConfiguration?.model?.model || "gpt-4.1-mini",
                messages: [
                  {
                    role: "system",
                    content: systemPrompt,
                  },
                ],
              },
              voice: {
                provider: agent.vapiConfiguration?.voice?.provider || "vapi",
                voiceId: agent.vapiConfiguration?.voice?.voiceId || "Elliot",
              },
              firstMessage: `Hi, this is ${
                agentConfig.agentName || "Sarah"
              } from ${
                agentConfig.storeName || "your store"
              }. I noticed you had some items in your cart but didn't complete your purchase. Is this a good time to talk for a minute?`,
            });

            console.log(
              "✅ VAPI Assistant created successfully:",
              vapiAssistant
            );

            // Update agent with VAPI configuration
            console.log("💾 Updating agent with VAPI configuration...");
            const updatedAgent = await axios.put(
              `/api/agents/${agent._id}/update-vapi`,
              {
                configuration: agentConfig,
                vapiConfiguration: {
                  ...agent.vapiConfiguration,
                  model: {
                    ...agent.vapiConfiguration?.model,
                    messages: [
                      {
                        role: "system",
                        content: systemPrompt,
                      },
                    ],
                  },
                  firstMessage: `Hi, this is ${
                    agentConfig.agentName || "Sarah"
                  } from ${
                    agentConfig.storeName || "your store"
                  }. I noticed you had some items in your cart but didn't complete your purchase. Is this a good time to talk for a minute?`,
                },
                vapiAgentId: vapiAssistant.id,
                shopifyShopId: selectedShop._id,
              }
            );

            console.log("✅ Agent updated successfully:", updatedAgent.data);

            // Redirect to agents page
            console.log(
              "🎯 Agent configuration completed successfully! Redirecting to agents page..."
            );
            router.push("/agent");
          } catch (error) {
            console.error("❌ Error updating agent:", error);
            console.error("❌ Error details:", {
              message: error.message,
              stack: error.stack,
              response:
                error.response?.data || error.body || "No response data",
            });
            alert("Failed to update agent. Please try again.");
          }
        }}
      />
    </DashboardLayout>
  );
};

export default AgentConfigurePage;
