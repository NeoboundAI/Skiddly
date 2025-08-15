import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Handle unauthorized
          console.error("Unauthorized access");
          break;
        case 403:
          // Handle forbidden
          console.error("Access forbidden");
          break;
        case 404:
          // Handle not found
          console.error("Resource not found");
          break;
        case 500:
          // Handle server error
          console.error("Server error");
          break;
        default:
          console.error(`HTTP Error: ${status}`);
      }

      // Return error with message from server
      return Promise.reject({
        message: data?.message || "Something went wrong",
        status,
        data,
      });
    } else if (error.request) {
      // Network error
      console.error("Network error:", error.request);
      return Promise.reject({
        message: "Network error. Please check your connection.",
        status: 0,
      });
    } else {
      // Other error
      console.error("Error:", error.message);
      return Promise.reject({
        message: error.message || "Something went wrong",
        status: 0,
      });
    }
  }
);

export default api;
