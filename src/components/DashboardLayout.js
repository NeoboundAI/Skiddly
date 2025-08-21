"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import Sidebar from "./Sidebar";
import useShopStore from "@/stores/shopStore";
import { clearAppCaches } from "@/utils/cacheUtils";

const DashboardLayout = ({ children }) => {
  const { data: session, status } = useSession();
  const { clearShops } = useShopStore();
  const queryClient = useQueryClient();

  // Clear shops and cache when user logs out
  useEffect(() => {
    if (status === "unauthenticated") {
      console.log("🚪 User logged out, clearing data...");
      clearAppCaches(queryClient, clearShops);
    }
  }, [status, clearShops, queryClient]);

  return (
    <div className="flex h-screen bg-[#F2F4F7]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex border border-[#D9D6FE] rounded-2xl bg-[#F2F4F7] m-4 ml-0 flex-col overflow-hidden">
        <main className="flex-1 bg-white overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
