"use client";

import { useState, useEffect } from "react";
import { FiX, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

const Toast = ({ message, type = "info", isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto close after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <FiCheckCircle className="w-5 h-5 text-green-600" />;
      case "error":
        return <FiAlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FiAlertCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2">
      <div
        className={`flex items-center p-4 border rounded-lg shadow-lg ${getToastStyles()}`}
      >
        <div className="flex-shrink-0 mr-3">{getIcon()}</div>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
