import React, { useState } from "react";
import { HiArrowRight } from "react-icons/hi";

const BigButton = ({
  children,
  onClick,
  className = "",
  type = "button",
  disabled = false,
  loadingText = "Loading...",
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e) => {
    if (isLoading || disabled) return;

    setIsLoading(true);

    try {
      if (onClick) {
        await onClick(e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`
        w-full h-11 px-4 py-2.5
        bg-[#6938EF] border border-[#5925DC] text-white
        font-medium rounded-md
        transition-all duration-200 ease-in-out
        hover:bg-[#5925DC] focus:outline-none focus:ring-2 focus:ring-[#6938EF] focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-[0px_4px_20px_0px_#00000026]
        flex items-center justify-center gap-2
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingText}
        </>
      ) : (
        <>
          {children}
          <HiArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  );
};

export default BigButton;
