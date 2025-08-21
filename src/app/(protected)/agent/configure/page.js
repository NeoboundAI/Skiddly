"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/DashboardLayout";

const AgentConfigurePage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Check if user is authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    } else if (status === "authenticated") {
      // Redirect to agents page where they can select a template
      router.push("/agent");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Redirecting...
          </h2>
          <p className="text-gray-600">
            Please select an agent template to get started.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AgentConfigurePage;
