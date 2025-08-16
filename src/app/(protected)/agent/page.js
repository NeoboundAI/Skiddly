"use client";

import DashboardLayout from "@/components/DashboardLayout";

const AgentPage = () => {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent</h1>
          <p className="text-gray-600">
            Configure your AI assistant personality and behavior
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI Agent Configuration
            </h3>
            <p className="text-gray-600">
              Set up your AI assistant to handle customer calls
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AgentPage;
