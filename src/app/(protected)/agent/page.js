"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import AgentSelectionModal from "@/components/AgentSelectionModal";
import { FiPlus, FiSettings, FiPhone, FiUser } from "react-icons/fi";
import axios from "axios";
import useShopStore from "@/stores/shopStore";

const AgentPage = () => {
  const router = useRouter();
  const { selectedShop } = useShopStore();
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user's agents for the selected shop
  useEffect(() => {
    if (selectedShop) {
      fetchAgents();
    } else {
      setAgents([]);
      setLoading(false);
    }
  }, [selectedShop]);

  const fetchAgents = async () => {
    if (!selectedShop) return;

    try {
      setLoading(true);
      const response = await axios.get("/api/agents");
      if (response.data.success) {
        // Filter agents by the currently selected shop
        // shopifyShopId is a populated object, so we need to compare _id
        const filteredAgents = response.data.data.filter(
          (agent) => agent.shopifyShopId?._id === selectedShop._id
        );
        setAgents(filteredAgents);
      } else {
        setError("Failed to fetch agents");
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      setError("Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = (agentId) => {
    router.push(`/agent/configure/${agentId}`);
  };

  const handleToggleLive = async (agentId, currentStatus) => {
    try {
      // Update agent status
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await axios.put(`/api/agents/${agentId}`, { status: newStatus });

      // Refresh agents list
      fetchAgents();
    } catch (error) {
      console.error("Error updating agent status:", error);
    }
  };

  const getAgentAvatar = (agentName) => {
    // Generate avatar based on agent name
    const initials = agentName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
        {initials}
      </div>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "abandoned-cart":
        return "bg-green-100 text-green-800";
      case "customer-support":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedShop) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-screen">
          <div className="flex w-full justify-between items-center border-b border-[#EAECF0] pb-4 mb-4">
            <h1 className="text-2xl font-semibold text-[#000000]">Agents</h1>
            <button
              onClick={() => setShowAgentModal(true)}
              className="bg-[#101828] text-white px-4 py-2 cursor-pointer rounded-md flex items-center gap-2"
            >
              <span>Add a new agent</span>
              <FiPlus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col gap-4 items-center justify-center w-full mt-30">
            <img
              src="/dropbox.png"
              alt="agent"
              className="w-[160px] h-[160px]"
            />
            <h2 className="text-2xl font-semibold text-[#000000]">
              No Shop Selected
            </h2>
            <p className="text-gray-600 text-center">
              Please select a Shopify shop to view and manage agents.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-screen">
        <div className="flex w-full justify-between items-center border-b border-[#EAECF0] pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#000000]">Agents</h1>
            <p className="text-sm text-gray-600 mt-1">
              Managing agents for {selectedShop.shop}
            </p>
          </div>
          <button
            onClick={() => setShowAgentModal(true)}
            className="bg-[#101828] text-white px-4 py-2 cursor-pointer rounded-md flex items-center gap-2"
          >
            <span>Add a new agent</span>
            <FiPlus className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {agents.length === 0 ? (
          <div className="flex flex-col gap-4 items-center justify-center w-full mt-30">
            <img
              src="/dropbox.png"
              alt="agent"
              className="w-[160px] h-[160px]"
            />
            <h2 className="text-2xl font-semibold text-[#000000]">
              No agents Available
            </h2>
            <p className="text-gray-600 text-center">
              No agents have been created for this shop yet.
            </p>
            <button
              onClick={() => setShowAgentModal(true)}
              className="border w-fit font-medium border-[#D0D5DD] cursor-pointer bg-white text-[#101828] px-4 py-2 rounded-md flex items-center gap-2"
            >
              <span>Add a new agent</span>
              <FiPlus className="w-4 h-4 font-bold" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div
                key={agent._id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                {/* Agent Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getAgentAvatar(agent.name)}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {agent.name}
                      </h3>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                          agent.type
                        )}`}
                      >
                        {agent.type === "abandoned-cart"
                          ? "Outbound"
                          : "Inbound"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        agent.status
                      )}`}
                    >
                      {agent.status === "active"
                        ? "Live"
                        : agent.status === "draft"
                        ? "Draft"
                        : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Agent Description */}
                <p className="text-sm text-gray-600 mb-4">
                  {agent.type === "abandoned-cart"
                    ? "Calls leads who has abandoned their cart as per your instructions."
                    : "Supports customer with their queries and provide support to them."}
                </p>

                {/* Agent Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FiPhone className="w-4 h-4" />
                    <span>+91-7627216127</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FiUser className="w-4 h-4" />
                    <span>Hindi / English</span>
                  </div>
                </div>

                {/* Agent Stats */}
                {agent.status === "active" && (
                  <div className="mb-4">
                    <span className="text-red-600 text-sm font-medium">
                      3 issues
                    </span>
                  </div>
                )}

                {/* Live Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">Live</span>
                  <button
                    onClick={() => handleToggleLive(agent._id, agent.status)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      agent.status === "active"
                        ? "bg-purple-600"
                        : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        agent.status === "active"
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Configure Button */}
                <button
                  onClick={() => handleConfigure(agent._id)}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <FiSettings className="w-4 h-4" />
                  Configure
                </button>
              </div>
            ))}

            {/* Build Your Agent Card */}
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-400 transition-colors cursor-pointer">
              <div className="flex items-center justify-center mb-4">
                <div className="text-2xl">✨</div>
                <div className="text-2xl ml-2">✨</div>
              </div>
              <h3 className="font-semibold text-gray-900 text-center mb-2">
                Build your agent
              </h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                Customize an agent from scratch, just the way you like it.
              </p>
              <button
                onClick={() => setShowAgentModal(true)}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <FiSettings className="w-4 h-4" />
                Configure
              </button>
            </div>
          </div>
        )}
      </div>

      <AgentSelectionModal
        isOpen={showAgentModal}
        onClose={() => setShowAgentModal(false)}
      />
    </DashboardLayout>
  );
};

export default AgentPage;
