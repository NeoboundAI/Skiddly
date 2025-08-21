"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiX } from "react-icons/fi";
import axios from "axios";

// Placeholder avatar for agent cards
const AgentAvatar = () => (
  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300">
    <img
      src="https://randomuser.me/api/portraits/men/32.jpg"
      alt="Agent Avatar"
      className="w-full h-full object-cover"
    />
  </div>
);

const categories = [
  { id: "all", label: "All" },
  { id: "ecommerce", label: "Ecommerce" },
  { id: "fintech", label: "Fintech" },
  { id: "banking", label: "Banking" },
];

const AgentSelectionModal = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [defaultAgents, setDefaultAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch default agents from backend
  useEffect(() => {
    if (isOpen) {
      fetchDefaultAgents();
    }
  }, [isOpen]);

  const fetchDefaultAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/agents/default");
      if (response.data.success) {
        setDefaultAgents(response.data.data);
      } else {
        setError("Failed to fetch agents");
      }
    } catch (error) {
      console.error("Error fetching default agents:", error);
      setError("Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  };

  // Filter agents by category
  const filteredAgents =
    activeCategory === "all"
      ? defaultAgents
      : defaultAgents.filter(
          (a) => a.category?.toLowerCase() === activeCategory
        );

  const handleAgentSelect = (agentId) => {
    setSelectedAgentId(agentId);
  };

  const handleContinue = async () => {
    if (selectedAgentId) {
      try {
        setLoading(true);
        // Create agent from template
        const response = await axios.post("/api/agents/create-from-template", {
          assistantId: selectedAgentId,
        });

        if (response.data.success) {
          const createdAgent = response.data.data;
          onClose();
          // Redirect to configuration page with the created agent ID
          router.push(`/agent/configure/${createdAgent._id}`);
        } else {
          setError("Failed to create agent");
        }
      } catch (error) {
        console.error("Error creating agent from template:", error);
        setError("Failed to create agent");
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blur background */}
      <div className="absolute inset-0 bg-[#0B1A2F]/60 backdrop-blur-[4px] transition-all" />
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            Choose an Agent
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        {/* Tabs */}
        <div className="flex space-x-2 px-8 pt-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-[#F2F6FF] text-[#1A2B49]"
                  : "bg-transparent text-gray-500 hover:bg-gray-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {/* Error Message */}
        {error && (
          <div className="px-8 pt-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          </div>
        )}
        {/* Agent Cards */}
        <div className="px-8 py-6">
          {loading && defaultAgents.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5B3DF6]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.assistantId}
                  onClick={() => handleAgentSelect(agent.assistantId)}
                  className={`relative group border rounded-lg p-5 bg-white cursor-pointer transition-all
                    ${
                      selectedAgentId === agent.assistantId
                        ? "border-[#5B3DF6] shadow-lg"
                        : "border-gray-200 hover:border-[#5B3DF6] hover:shadow-md"
                    }
                  `}
                >
                  {/* Status badge */}
                  <div className="absolute top-4 right-4">
                    <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                      Template
                    </span>
                  </div>
                  {/* Avatar */}
                  <div className="flex items-center mb-4">
                    <AgentAvatar />
                    <div className="ml-3">
                      <div className="text-xs text-gray-500">
                        {agent.type === "abandoned-cart"
                          ? "Outbound"
                          : "Inbound"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {agent.languages}
                      </div>
                    </div>
                  </div>
                  {/* Name */}
                  <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">
                    {agent.name}
                  </h3>
                  {/* Description */}
                  <p className="text-xs text-gray-500 mb-4 min-h-[32px]">
                    {agent.description}
                  </p>
                  {/* Select button */}
                  <div className="flex items-center">
                    {selectedAgentId === agent.assistantId ? (
                      <button
                        className="bg-[#5B3DF6] text-white text-xs font-semibold px-4 py-2 rounded-lg w-full"
                        disabled
                      >
                        Selected
                      </button>
                    ) : (
                      <button className="border border-gray-200 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg w-full bg-white hover:border-[#5B3DF6] hover:text-[#5B3DF6] transition">
                        Select
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="flex justify-end px-8 py-4 border-t border-gray-100">
          <button
            className={`bg-[#1A2B49] text-white px-6 py-2 rounded-lg font-semibold text-sm transition ${
              selectedAgentId && !loading
                ? "hover:bg-[#223366] cursor-pointer"
                : "opacity-60 cursor-not-allowed"
            }`}
            disabled={!selectedAgentId || loading}
            onClick={handleContinue}
          >
            {loading ? "Creating..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentSelectionModal;
