"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  FiHome,
  FiBox,
  FiUser,
  FiBook,
  FiLink,
  FiBarChart2,
  FiSettings,
  FiCreditCard,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
  FiUser as FiUserIcon,
} from "react-icons/fi";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const userMenuRef = useRef(null);

  const navigationItems = [
    { name: "Home", icon: FiHome, path: "/dashboard" },
    { name: "Orders", icon: FiBox, path: "/orders" },
    { name: "Agent", icon: FiUser, path: "/agent" },
    { name: "Knowledge", icon: FiBook, path: "/knowledge" },
    { name: "Integration", icon: FiLink, path: "/integration" },
    { name: "Analytics", icon: FiBarChart2, path: "/analytics" },
    { name: "Configuration", icon: FiSettings, path: "/configuration" },
    { name: "Billing & Usage", icon: FiCreditCard, path: "/billing" },
  ];

  const handleNavigation = (path) => {
    router.push(path);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth" });
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center justify-center ">
                <img src="/skiddly.svg" alt="Skiddly Logo" className="w-34 h-10" />
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              {isCollapsed ? (
                <FiChevronRight className="w-4 h-4 text-gray-600" />
              ) : (
                <FiChevronLeft className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-purple-50 text-purple-600 border border-purple-200"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? "text-purple-600" : "text-gray-500"
                  }`}
                />
                {!isCollapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div
          className="p-4 border-t border-gray-200 relative"
          ref={userMenuRef}
        >
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {session?.user?.name?.charAt(0) || "U"}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500">Manage account</p>
              </div>
            )}
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-2">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                >
                  <FiLogOut className="w-4 h-4" />
                  {!isCollapsed && <span>Sign out</span>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
