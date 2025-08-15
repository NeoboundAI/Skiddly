import React, { useState } from "react";

const TextInput = ({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  disabled = false,
  required = false,
  className = "",
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[#020617] mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`
            w-full h-10 px-3 py-2.5
            bg-white border rounded-md border-[#E2E8F0]
            text-sm text-[#020617] placeholder-[#64748B]
            transition-all duration-200 ease-in-out hover:border-purple-200
            focus:outline-none focus:ring-1 focus:ring-purple-300 focus:border-purple-400
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${          
              isFocused
                ? "border-purple-300 shadow-sm"
                : error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-200 hover:border-gray-300"
            }
            ${error ? "border-red-300" : ""}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

// Password Input with toggle visibility
const PasswordInput = ({
  label,
  placeholder = "••••",
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  disabled = false,
  required = false,
  className = "",
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`
            w-full h-10 px-3 pr-10 py-2.5
            bg-white border rounded-md
            text-sm text-[#020617] placeholder-[#64748B]
            transition-all duration-200 ease-in-out hover:border-purple-200
            focus:outline-none focus:ring-1 focus:ring-purple-300 focus:border-purple-400
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${
              isFocused
                    ? "border-purple-300 shadow-sm"
                : error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-200 hover:border-gray-300"
            }
            ${error ? "border-red-300" : ""}
          `}
          {...props}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
          disabled={disabled}
        >
          {showPassword ? (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

// Email Input with validation
const EmailInput = ({
  label = "Email",
  placeholder = "Eg. john@abc.com",
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  disabled = false,
  required = false,
  className = "",
  ...props
}) => {
  return (
    <TextInput
      type="email"
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      error={error}
      disabled={disabled}
      required={required}
      className={className}
      {...props}
    />
  );
};

export { TextInput, PasswordInput, EmailInput };
export default TextInput;
