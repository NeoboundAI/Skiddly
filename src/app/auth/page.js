"use client";

import { useState } from "react";
import LoginForm from "./login/LoginForm";
import RegisterForm from "./register/RegisterForm";

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState("signin");

  return (
    <div className="min-h-screen p-4 flex bg-gradient-to-b from-purple-200 via-purple-50 to-purple-100">
      {/* Left side with logo */}
      <div className="w-[35%] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="mb-4">
            {/* Logo */}
            <img
              src="/skiddly.svg"
              alt="Skiddly Logo"
              className="w-60 h-30"
              style={{ filter: "drop-shadow(0 2px 8px rgba(128,90,213,0.15))" }}
            />
          </div>
        </div>
      </div>
      {/* Right side with auth form */}
      <div
        style={{
          backgroundImage: "url('/dotpattern.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="w-[65%] flex border border-[#D9D6FE] bg-[#F9FAFB] rounded-lg flex-col items-center justify-center"
      >
        <div className="w-[420px]">
          <div className="flex mb-6 p-1  bg-[#F2F4F7] rounded-full overflow-hidden relative">
            <div className="w-full h-full relative flex">
            <button
              className={`flex-1 py-3 shadow-xs  text-sm font-medium transition-all duration-200 relative z-10 ${
                activeTab === "signin" ? "text-[#020617]" : "text-[#667085]"
              }`}
              onClick={() => setActiveTab("signin")}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium transition-all duration-200 relative z-10 ${
                activeTab === "signup" ? "text-gray-800" : "text-gray-500"
              }`}
              onClick={() => setActiveTab("signup")}
            >
              Sign up
            </button>
            {/* Animated slider */}
            <div
              className={`absolute top-0 h-full bg-white rounded-full shadow-sm transition-all duration-200 ease-in-out ${
                activeTab === "signin" ? "left-0 w-1/2" : "left-1/2 w-1/2"
                }`}
              />
            </div>
          </div>
          {/* Form */}
          <div>{activeTab === "signin" ? <LoginForm /> : <RegisterForm />}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
