"use client";

import Sidebar from "./Sidebar";

const DashboardLayout = ({ children }) => {
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
