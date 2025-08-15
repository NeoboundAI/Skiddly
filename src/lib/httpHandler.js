import axios from "axios";

/**
 * Makes an HTTP request using axios, logging request and response details.
 * @param {string} url - The endpoint URL.
 * @param {Object} options - Axios request config (method, headers, data, etc).
 * @returns {Promise<Object>} - The response data.
 */
export async function httpRequest(url, options = {}) {
  // Log request details
  console.log("HTTP Request:", {
    url,
    method: options.method || "GET",
    headers: options.headers,
    data: options.data,
    params: options.params,
  });

  try {
    const response = await axios({ url, ...options });
    return response.data;
  } catch (error) {
    // Log error details
    if (error.response) {
      console.error("HTTP Error Response:", {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data,
      });
    } else {
      console.error("HTTP Error:", error.message);
    }
    throw error;
  }
}
