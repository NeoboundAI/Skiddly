import React from "react";

export const BackIcon = ({ className = "", strokeWidth = "2", ...props }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    
    {...props}
  >
    <path
      d="M10.5 12L7.5 9L10.5 6"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
