import api from "./axios";

// Authentication API functions
export const authAPI = {
  // Check if email exists
  checkEmail: async (email) => {
    const response = await api.post("/auth/check-email", { email });
    return response.data;
  },

  // Register new user
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  // Forgot password - send OTP
  forgotPassword: async (email) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    const response = await api.post("/auth/verify-otp", { email, otp });
    return response.data;
  },

  // Resend OTP
  resendOTP: async (email) => {
    const response = await api.post("/auth/resend-otp", { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (email, otp, newPassword) => {
    const response = await api.post("/auth/reset-password", {
      email,
      otp,
      newPassword,
    });
    return response.data;
  },
};

export default authAPI;
