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
import ShopSelector from "./ShopSelector";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const userMenuRef = useRef(null);

  // Split navigation into two sections: main and billing
  const mainNavigationItems = [
    { name: "Home", icon: FiHome, path: "/dashboard" },
    { name: "Orders", icon: FiBox, path: "/orders" },
    { name: "Agent", icon: FiUser, path: "/agent" },
    { name: "Knowledge", icon: FiBook, path: "/knowledge" },
    { name: "Integration", icon: FiLink, path: "/integration" },
    { name: "Analytics", icon: FiBarChart2, path: "/analytics" },
  ];
  const secondaryNavigationItems = [
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
      className={`bg-gradient-to-b from-purple-200 via-purple-50 to-purple-100 relative  transition-all duration-300 ${
        isCollapsed ? "w-[74px]" : "w-56"
      }`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-1 py-3 rounded-full absolute cursor-pointer -right-3 top-1/2 -translate-y-1/2 bg-white border border-[#D9D6FE]"
        style={{ zIndex: 10 }}
      >
        {isCollapsed ? (
          <FiChevronRight className="w-3 h-3 text-[#000000]" />
        ) : (
          <FiChevronLeft className="w-3 h-3 text-[#000000]" />
        )}
      </button>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-4 py-[40px] ">
          <div className="flex items-center justify-center">
            {!isCollapsed && (
              <div className="flex items-center justify-center ">
                <img
                  src="/skiddly.svg"
                  alt="Skiddly Logo"
                  className="w-34 h-10"
                />
              </div>
            )}
            {isCollapsed && (
              <div className="flex items-center justify-center ">
                <img
                  src="/skiddlysmall.png"
                  alt="Skiddly Logo"
                  className="w-6 h-8 m-auto"
                />
              </div>
            )}
          </div>
        </div>

        {/* Shop Selector */}
        <ShopSelector isCollapsed={isCollapsed} />

        {/* Navigation Items */}
        <nav className="flex-1 p-4 flex flex-col">
          {/* Main navigation */}
          {mainNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <button
                key={item.name}
                style={
                  isActive
                    ? {
                        boxShadow: "0px 4px 8px 0px #6C44FA1A",
                      }
                    : {}
                }
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center cursor-pointer justify-between rounded-lg p-3 transition-colors ${
                  isActive
                    ? "bg-white text-[#000000] border border-[#BDB4FE]"
                    : "text-[#000000] hover:bg-[#F2F4F7]"
                }`}
              >
                <div className="flex  items-center ">
                  <Icon
                    className={`w-4 h-4  ${
                      isActive ? "text-purple-400" : "text-purple-400"
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="font-medium ml-2 text-sm line-height-[18px]">
                      {item.name}
                    </span>
                  )}
                </div>
                {isActive && !isCollapsed && (
                  <FiChevronRight className="w-4 h-4  text-[#000000]" />
                )}
              </button>
            );
          })}

          {/* Gap of 24px between Configuration and Billing & Usage */}
          <div className="mt-6" />

          {/* Billing navigation */}
          {secondaryNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <button
                key={item.name}
                style={
                  isActive
                    ? {
                        boxShadow: "0px 4px 8px 0px #6C44FA1A",
                      }
                    : {}
                }
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center cursor-pointer justify-between rounded-lg p-3 transition-colors ${
                  isActive
                    ? "bg-white text-[#000000] border border-[#BDB4FE]"
                    : "text-[#000000] hover:bg-[#F2F4F7]"
                }`}
              >
                <div className="flex  items-center ">
                  <Icon
                    className={`w-4 h-4  ${
                      isActive ? "text-purple-400" : "text-purple-400"
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="font-medium ml-2 text-sm line-height-[18px]">
                      {item.name}
                    </span>
                  )}
                </div>
                <div>
                  {isActive && (
                    <FiChevronRight className="w-4 h-4  text-[#000000]" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 py-[40px]  relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center space-x-3 justify-center rounded-lg  transition-colors"
          >
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {session?.user?.name?.charAt(0) || "U"}
                </span>
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-base font-semibold text-[#000000] truncate">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-xs font-medium text-[#98A2B3]">
                  Manage account
                </p>
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
