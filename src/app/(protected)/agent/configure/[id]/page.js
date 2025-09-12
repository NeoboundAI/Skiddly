"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/DashboardLayout";
import AgentWizard from "@/components/AgentWizard";
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
              Please select a Shopify shop to configure agents.
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

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <AgentWizard
          agent={agent}
          selectedShop={selectedShop}
          onSave={fetchAgent}
          agentId={params.id}
        />
      </div>
    </DashboardLayout>
  );
};

export default AgentConfigurePage;
