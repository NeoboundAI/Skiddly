"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EmailInput from "@/components/ui/TextInputs";
import PasswordInput from "@/components/ui/TextInputs";
import TextInput from "@/components/ui/TextInputs";
import BigButton from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";

const ForgotPasswordForm = () => {
  const router = useRouter();
  const { forgotPassword, verifyOTP, resendOTP, resetPassword } = useAuth();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    try {
      await forgotPassword.mutateAsync({
        email: formData.email.trim().toLowerCase(),
      });
      setStep(2);
      setResendCountdown(60); // Start 60 second countdown
    } catch (error) {
      setError(error.message || "Something went wrong. Please try again.");
    }
  };

  const handleResendOTP = async () => {
    setError("");

    try {
      await resendOTP.mutateAsync({
        email: formData.email.trim().toLowerCase(),
      });
      setResendCountdown(60); // Reset countdown
      setError(""); // Clear any previous errors
    } catch (error) {
      setError(error.message || "Failed to resend OTP. Please try again.");
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    try {
      await verifyOTP.mutateAsync({
        email: formData.email.trim().toLowerCase(),
        otp: formData.otp,
      });
      setStep(3);
    } catch (error) {
      setError(error.message || "Invalid OTP. Please try again.");
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const { newPassword, confirmPassword } = formData;

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      await resetPassword.mutateAsync({
        email: formData.email.trim().toLowerCase(),
        otp: formData.otp,
        newPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth");
      }, 3000);
    } catch (error) {
      setError(error.message || "Failed to reset password. Please try again.");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field-specific error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }

    // Clear general error when user makes changes
    if (error) {
      setError("");
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError("");
      setFieldErrors({});
    }
  };

  const editEmail = () => {
    setStep(1);
    setError("");
    setFieldErrors({});
    setResendCountdown(0);
  };

  if (success) {
    return (
      <div className="py-[27px] px-[24px] bg-white rounded-lg border border-[#E2E8F0]">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-[#020617] mb-2">
            Password saved!
          </h2>
          <p className="text-sm text-gray-600 mb-4">Back to login in 0:03</p>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full animate-pulse"
              style={{ width: "100%" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-[27px] px-[24px] bg-white rounded-lg border border-[#E2E8F0]">
      {step === 1 ? (
        // Step 1: Email input
        <>
          <h2 className="text-2xl font-bold text-[#020617] mb-6">
            Reset Password
          </h2>

          <form onSubmit={handleEmailSubmit} className="">
            <EmailInput
              label="Email"
              placeholder="Eg. john@abc.com"
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              error={fieldErrors.email}
              required
              className="mb-4"
            />

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <BigButton
              type="submit"
              disabled={forgotPassword.isPending}
              loadingText="Sending OTP..."
              className="mt-4"
            >
              Next
            </BigButton>
          </form>
        </>
      ) : step === 2 ? (
        // Step 2: OTP input
        <>
          <h2 className="text-2xl font-bold text-[#020617] mb-6">Enter OTP</h2>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Sent on {formData.email}
              <button
                type="button"
                onClick={editEmail}
                className="ml-2 text-purple-600 hover:text-purple-700 underline"
              >
                Edit
              </button>
            </p>
          </div>

          <form onSubmit={handleOTPSubmit} className="">
            <TextInput
              label="One time password"
              placeholder="••••"
              type="text"
              name="otp"
              value={formData.otp}
              onChange={(e) => handleInputChange("otp", e.target.value)}
              error={fieldErrors.otp}
              required
              className="mb-4"
            />

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <BigButton
              type="submit"
              disabled={verifyOTP.isPending}
              loadingText="Verifying..."
              className="mt-4"
            >
              Next
            </BigButton>
          </form>

          {/* Resend OTP Section */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            {resendCountdown > 0 ? (
              <p className="text-sm text-gray-500">
                Resend in {resendCountdown}s
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendOTP.isPending}
                className="text-sm text-purple-600 hover:text-purple-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendOTP.isPending ? "Sending..." : "Resend OTP"}
              </button>
            )}
          </div>
        </>
      ) : (
        // Step 3: New password
        <>
          <h2 className="text-2xl font-bold text-[#020617] mb-6">
            Set a new password
          </h2>

          <form onSubmit={handlePasswordReset} className="">
            <PasswordInput
              label="New Password"
              placeholder="••••••"
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={(e) => handleInputChange("newPassword", e.target.value)}
              error={fieldErrors.newPassword}
              required
              className="mb-4"
            />

            <PasswordInput
              label="New Password again"
              placeholder="••••••"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              error={fieldErrors.confirmPassword}
              required
              className="mb-4"
            />

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <BigButton
              type="submit"
              disabled={resetPassword.isPending}
              loadingText="Resetting password..."
              className="mt-4"
            >
              Reset password
            </BigButton>
          </form>
        </>
      )}

      {/* Back link */}
      <div className="mt-6 text-left">
        <Link
          href="/auth"
          className="text-sm text-[#020617] hover:text-[#020617] underline"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
