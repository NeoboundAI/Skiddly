"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useAdminStats } from "@/hooks/useAdmin";
import useAdminStore from "@/stores/adminStore";
import {
  FiUsers,
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiTrendingUp,
  FiDollarSign,
  FiPhone,
  FiShoppingCart,
  FiClock,
  FiShield,
  FiDatabase,
  FiServer,
  FiFileText,
  FiSettings,
} from "react-icons/fi";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const { stats, statsLoading } = useAdminStore();

  // Use the hook - it will automatically fetch data
  const { data: statsData, isLoading, error, refetch } = useAdminStats();

  // Update store when data is fetched
  useEffect(() => {
    if (statsData) {
      // The store is already updated in the hook
      console.log("Admin stats loaded:", statsData);
    }
  }, [statsData]);

  const adminStats = [
    {
      id: 1,
      title: "Total Users",
      value: stats?.totalUsers || 0,
      change: "+12%",
      changeType: "positive",
      icon: FiUsers,
      color: "blue",
      description: "Active users in the system",
    },
    {
      id: 2,
      title: "Active Sessions",
      value: stats?.activeUsers || 0,
      change: "+5%",
      changeType: "positive",
      icon: FiActivity,
      color: "green",
      description: "Currently active sessions",
    },
    {
      id: 3,
      title: "System Errors",
      value: stats?.totalErrors || 0,
      change: "-8%",
      changeType: "negative",
      icon: FiAlertTriangle,
      color: "red",
      description: "Errors in the last 24 hours",
    },
    {
      id: 4,
      title: "System Health",
      value: stats?.systemHealth || "Good",
      change: "+2%",
      changeType: "positive",
      icon: FiCheckCircle,
      color: "green",
      description: "Overall system status",
    },
  ];

  const quickActions = [
    {
      id: 1,
      title: "View Logs",
      description: "Check system logs and errors",
      icon: FiFileText,
      path: "/admin/logs",
      color: "purple",
    },
    {
      id: 2,
      title: "Manage Users",
      description: "View and manage user accounts",
      icon: FiUsers,
      path: "/admin/users",
      color: "blue",
    },
    {
      id: 3,
      title: "System Settings",
      description: "Configure system parameters",
      icon: FiSettings,
      path: "/admin/settings",
      color: "green",
    },
    {
      id: 4,
      title: "Security",
      description: "Security and access controls",
      icon: FiShield,
      path: "/admin/security",
      color: "red",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "user_registration",
      message: "New user registered: john@example.com",
      timestamp: "2 minutes ago",
      severity: "info",
    },
    {
      id: 2,
      type: "system_error",
      message: "Database connection timeout resolved",
      timestamp: "5 minutes ago",
      severity: "warning",
    },
    {
      id: 3,
      type: "admin_action",
      message: "Admin updated user permissions",
      timestamp: "10 minutes ago",
      severity: "info",
    },
    {
      id: 4,
      type: "system_health",
      message: "System health check completed",
      timestamp: "15 minutes ago",
      severity: "success",
    },
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "error":
        return "text-red-600 bg-red-50";
      case "warning":
        return "text-yellow-600 bg-yellow-50";
      case "success":
        return "text-green-600 bg-green-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "error":
        return FiAlertTriangle;
      case "warning":
        return FiClock;
      case "success":
        return FiCheckCircle;
      default:
        return FiActivity;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading admin stats</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl border-b border-[#EAECF0] font-semibold text-[#000000] pb-4 mb-4">
            Admin Dashboard
          </h1>
          <div className="flex items-left flex-col justify-center space-x-2">
            <p className="text-2xl text-[#000000] font-semibold">
              Welcome back, {session?.user?.name?.split(" ")[0] || "Admin"}!
            </p>
            <p className="text-[#667085] text-base font-medium">
              System overview and management
            </p>
          </div>
        </div>

        {/* Admin Role Badge */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {session?.user?.role === "super_admin"
                  ? "Super Administrator"
                  : "Administrator"}
              </h3>
              <p className="text-sm text-gray-600">
                Full system access and management capabilities
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">
                <FiShield className="w-8 h-8" />
              </div>
              <div className="text-xs text-gray-500">admin access</div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {adminStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                className="bg-white p-6 rounded-lg border border-[#EAECF0] shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#667085] mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-[#101828]">
                      {stat.value}
                    </p>
                    <p className="text-xs text-[#667085] mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-[#667085] ml-1">
                    from last month
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                className="bg-white p-6 rounded-lg border border-[#EAECF0] shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => (window.location.href = action.path)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full bg-${action.color}-100`}>
                    <Icon className={`w-6 h-6 text-${action.color}-600`} />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-[#101828] mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-[#667085]">{action.description}</p>
              </div>
            );
          })}
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg border border-[#EAECF0] shadow-sm">
          <div className="p-6 border-b border-[#EAECF0]">
            <h3 className="text-lg font-semibold text-[#101828]">
              Recent Activities
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = getSeverityIcon(activity.severity);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div
                      className={`p-2 rounded-full ${getSeverityColor(
                        activity.severity
                      )}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#101828]">
                        {activity.message}
                      </p>
                      <p className="text-xs text-[#667085] mt-1">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
