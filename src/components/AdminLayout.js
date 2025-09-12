"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import AdminSidebar from "./AdminSidebar";
import useShopStore from "@/stores/shopStore";
import { clearAppCaches } from "@/utils/cacheUtils";

const AdminLayout = ({ children }) => {
  const { data: session, status } = useSession();
  const { clearShops } = useShopStore();
  const queryClient = useQueryClient();

  // Clear shops and cache when user logs out
  useEffect(() => {
    if (status === "unauthenticated") {
      console.log("🚪 Admin logged out, clearing data...");
      clearAppCaches(queryClient, clearShops);
    }
  }, [status, clearShops, queryClient]);

  // Check if user is admin
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      return;
    }

    if (
      !session.user.role ||
      !["admin", "super_admin"].includes(session.user.role)
    ) {
      // Redirect non-admin users to regular dashboard
      window.location.href = "/dashboard";
      return;
    }
  }, [session, status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!session || !["admin", "super_admin"].includes(session.user.role)) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#F2F4F7]">
      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex border border-[#D9D6FE] rounded-2xl bg-[#F2F4F7] m-4 ml-0 flex-col overflow-hidden">
        <main className="flex-1 bg-white  p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
