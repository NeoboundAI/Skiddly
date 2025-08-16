import { useMutation, useQuery } from "@tanstack/react-query";
import { authAPI } from "./api";

// React Query keys
export const queryKeys = {
  auth: {
    checkEmail: (email) => ["auth", "checkEmail", email],
    user: ["auth", "user"],
  },
};

// Authentication hooks
export const useAuth = () => {
  // Check email availability
  const checkEmail = useMutation({
    mutationFn: authAPI.checkEmail,
    onError: (error) => {
      console.error("Email check error:", error);
    },
  });

  // Register user
  const register = useMutation({
    mutationFn: authAPI.register,
    onError: (error) => {
      console.error("Registration error:", error);
    },
  });

  // Forgot password
  const forgotPassword = useMutation({
    mutationFn: authAPI.forgotPassword,
    onError: (error) => {
      console.error("Forgot password error:", error);
    },
  });

  // Verify OTP
  const verifyOTP = useMutation({
    mutationFn: authAPI.verifyOTP,
    onError: (error) => {
      console.error("OTP verification error:", error);
    },
  });

  // Resend OTP
  const resendOTP = useMutation({
    mutationFn: authAPI.resendOTP,
    onError: (error) => {
      console.error("Resend OTP error:", error);
    },
  });

  // Reset password
  const resetPassword = useMutation({
    mutationFn: authAPI.resetPassword,
    onError: (error) => {
      console.error("Password reset error:", error);
    },
  });

  return {
    checkEmail,
    register,
    forgotPassword,
    verifyOTP,
    resendOTP,
    resetPassword,
  };
};

// Custom hook for email availability check
export const useCheckEmail = (email, enabled = false) => {
  return useQuery({
    queryKey: queryKeys.auth.checkEmail(email),
    queryFn: () => authAPI.checkEmail({ email }),
    enabled: enabled && !!email,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
