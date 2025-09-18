/**
 * Service for handling customer-requested reschedule times
 */

import {
  getTimezoneFromPhoneNumber,
  convertTimeToAgentTimezone,
  isWithinBusinessHours,
  getNextBusinessTime,
} from "../utils/timezoneUtils.js";

/**
 * Calculate reschedule time based on customer request and agent configuration
 * @param {Object} callAnalysis - AI analysis result with structured data
 * @param {string} customerPhone - Customer phone number
 * @param {Object} agentConfig - Agent configuration
 * @returns {Object} Reschedule calculation result
 */
export async function calculateRescheduleTime(
  callAnalysis,
  customerPhone,
  agentConfig
) {
  try {
    const structuredData = callAnalysis.structuredData || {};

    // Check if customer requested reschedule
    if (!structuredData.rescheduleRequested) {
      return {
        success: false,
        reason: "No reschedule requested",
        nextCallTime: null,
      };
    }

    // Get customer timezone from phone number
    const customerTimezone = getTimezoneFromPhoneNumber(customerPhone);

    // Get agent timezone
    const agentTimezone =
      agentConfig.callSchedule?.timezone || "America/New_York";

    // Parse customer's requested time
    const rescheduleResult = await parseCustomerRescheduleRequest(
      structuredData,
      customerTimezone,
      agentTimezone,
      agentConfig
    );

    return rescheduleResult;
  } catch (error) {
    console.error("Error calculating reschedule time:", error);
    return {
      success: false,
      reason: "Error processing reschedule request",
      nextCallTime: null,
      error: error.message,
    };
  }
}

/**
 * Parse customer's reschedule request and convert to agent timezone
 * @param {Object} structuredData - AI extracted structured data
 * @param {string} customerTimezone - Customer timezone
 * @param {string} agentTimezone - Agent timezone
 * @param {Object} agentConfig - Agent configuration
 * @returns {Object} Parsed reschedule result
 */
async function parseCustomerRescheduleRequest(
  structuredData,
  customerTimezone,
  agentTimezone,
  agentConfig
) {
  const { rescheduleTime, rescheduleDate, relativeTime, rescheduleTimezone } =
    structuredData;

  // Handle relative time requests (e.g., "in 2 hours", "tomorrow morning")
  if (relativeTime) {
    return handleRelativeTimeRequest(relativeTime, agentTimezone, agentConfig);
  }

  // Handle specific time requests (e.g., "3 PM tomorrow")
  if (rescheduleTime && rescheduleDate) {
    return handleSpecificTimeRequest(
      rescheduleTime,
      rescheduleDate,
      customerTimezone,
      agentTimezone,
      agentConfig
    );
  }

  // Handle timezone-specific requests (e.g., "3 PM EST")
  if (rescheduleTimezone && rescheduleTime) {
    return handleTimezoneSpecificRequest(
      rescheduleTime,
      rescheduleTimezone,
      agentTimezone,
      agentConfig
    );
  }

  // Fallback to agent's retry intervals
  return {
    success: false,
    reason: "Could not parse specific time request",
    nextCallTime: null,
  };
}

/**
 * Handle relative time requests like "in 2 hours", "tomorrow morning"
 * @param {string} relativeTime - Relative time string
 * @param {string} agentTimezone - Agent timezone
 * @param {Object} agentConfig - Agent configuration
 * @returns {Object} Parsed result
 */
function handleRelativeTimeRequest(relativeTime, agentTimezone, agentConfig) {
  try {
    const now = new Date();
    let nextCallTime = new Date(now);

    // Parse relative time
    const lowerTime = relativeTime.toLowerCase();

    if (lowerTime.includes("hour")) {
      const hours = extractNumber(relativeTime) || 1;
      nextCallTime.setHours(nextCallTime.getHours() + hours);
    } else if (lowerTime.includes("minute")) {
      const minutes = extractNumber(relativeTime) || 30;
      nextCallTime.setMinutes(nextCallTime.getMinutes() + minutes);
    } else if (lowerTime.includes("tomorrow")) {
      nextCallTime.setDate(nextCallTime.getDate() + 1);
      if (lowerTime.includes("morning")) {
        nextCallTime.setHours(9, 0, 0, 0);
      } else if (lowerTime.includes("afternoon")) {
        nextCallTime.setHours(14, 0, 0, 0);
      } else if (lowerTime.includes("evening")) {
        nextCallTime.setHours(18, 0, 0, 0);
      }
    } else if (lowerTime.includes("day")) {
      const days = extractNumber(relativeTime) || 1;
      nextCallTime.setDate(nextCallTime.getDate() + days);
    }

    // Validate against agent's business hours
    const isValid = isWithinBusinessHours(
      nextCallTime,
      agentTimezone,
      agentConfig.callSchedule?.callTimeStart || "09:00",
      agentConfig.callSchedule?.callTimeEnd || "18:00"
    );

    if (!isValid) {
      // Adjust to next business time
      nextCallTime = getNextBusinessTime(
        agentTimezone,
        agentConfig.callSchedule?.callTimeStart || "09:00",
        agentConfig.callSchedule?.callTimeEnd || "18:00",
        agentConfig.callSchedule?.weekendCalling || false
      );
    }

    return {
      success: true,
      reason: "Relative time request processed",
      nextCallTime: nextCallTime,
      customerRequest: relativeTime,
    };
  } catch (error) {
    console.error("Error handling relative time request:", error);
    return {
      success: false,
      reason: "Error parsing relative time",
      nextCallTime: null,
    };
  }
}

/**
 * Handle specific time requests like "3 PM tomorrow"
 * @param {string} rescheduleTime - Time string (e.g., "3:00 PM")
 * @param {string} rescheduleDate - Date string (e.g., "tomorrow", "2024-01-15")
 * @param {string} customerTimezone - Customer timezone
 * @param {string} agentTimezone - Agent timezone
 * @param {Object} agentConfig - Agent configuration
 * @returns {Object} Parsed result
 */
function handleSpecificTimeRequest(
  rescheduleTime,
  rescheduleDate,
  customerTimezone,
  agentTimezone,
  agentConfig
) {
  try {
    // Parse time
    const time = parseTimeString(rescheduleTime);
    if (!time) {
      return {
        success: false,
        reason: "Could not parse time",
        nextCallTime: null,
      };
    }

    // Parse date
    const date = parseDateString(rescheduleDate);
    if (!date) {
      return {
        success: false,
        reason: "Could not parse date",
        nextCallTime: null,
      };
    }

    // Convert to agent timezone
    const nextCallTime = convertTimeToAgentTimezone(
      `${time.hours}:${time.minutes.toString().padStart(2, "0")}`,
      customerTimezone,
      agentTimezone,
      date
    );

    // Validate against agent's business hours
    const isValid = isWithinBusinessHours(
      nextCallTime,
      agentTimezone,
      agentConfig.callSchedule?.callTimeStart || "09:00",
      agentConfig.callSchedule?.callTimeEnd || "18:00"
    );

    if (!isValid) {
      return {
        success: false,
        reason: "Requested time is outside business hours",
        nextCallTime: null,
        suggestedTime: getNextBusinessTime(
          agentTimezone,
          agentConfig.callSchedule?.callTimeStart || "09:00",
          agentConfig.callSchedule?.callTimeEnd || "18:00",
          agentConfig.callSchedule?.weekendCalling || false
        ),
      };
    }

    return {
      success: true,
      reason: "Specific time request processed",
      nextCallTime: nextCallTime,
      customerRequest: `${rescheduleTime} ${rescheduleDate}`,
    };
  } catch (error) {
    console.error("Error handling specific time request:", error);
    return {
      success: false,
      reason: "Error parsing specific time",
      nextCallTime: null,
    };
  }
}

/**
 * Handle timezone-specific requests like "3 PM EST"
 * @param {string} rescheduleTime - Time string
 * @param {string} rescheduleTimezone - Timezone hint
 * @param {string} agentTimezone - Agent timezone
 * @param {Object} agentConfig - Agent configuration
 * @returns {Object} Parsed result
 */
function handleTimezoneSpecificRequest(
  rescheduleTime,
  rescheduleTimezone,
  agentTimezone,
  agentConfig
) {
  try {
    // Map timezone hints to actual timezones
    const timezoneMap = {
      EST: "America/New_York",
      EDT: "America/New_York",
      PST: "America/Los_Angeles",
      PDT: "America/Los_Angeles",
      IST: "Asia/Kolkata",
      GMT: "Europe/London",
      UTC: "UTC",
    };

    const actualTimezone =
      timezoneMap[rescheduleTimezone.toUpperCase()] || "UTC";

    // Parse time
    const time = parseTimeString(rescheduleTime);
    if (!time) {
      return {
        success: false,
        reason: "Could not parse time",
        nextCallTime: null,
      };
    }

    // Use today's date
    const today = new Date().toISOString().split("T")[0];

    // Convert to agent timezone
    const nextCallTime = convertTimeToAgentTimezone(
      `${time.hours}:${time.minutes.toString().padStart(2, "0")}`,
      actualTimezone,
      agentTimezone,
      today
    );

    return {
      success: true,
      reason: "Timezone-specific request processed",
      nextCallTime: nextCallTime,
      customerRequest: `${rescheduleTime} ${rescheduleTimezone}`,
    };
  } catch (error) {
    console.error("Error handling timezone-specific request:", error);
    return {
      success: false,
      reason: "Error parsing timezone-specific time",
      nextCallTime: null,
    };
  }
}

/**
 * Extract number from string
 * @param {string} str - String to extract number from
 * @returns {number|null} Extracted number or null
 */
function extractNumber(str) {
  const match = str.match(/\d+/);
  return match ? parseInt(match[0]) : null;
}

/**
 * Parse time string like "3:00 PM" or "15:00"
 * @param {string} timeStr - Time string
 * @returns {Object|null} Parsed time object or null
 */
function parseTimeString(timeStr) {
  try {
    const time = timeStr.trim();

    // Handle 24-hour format (15:00)
    if (time.includes(":") && !time.includes("AM") && !time.includes("PM")) {
      const [hours, minutes] = time.split(":");
      return {
        hours: parseInt(hours),
        minutes: parseInt(minutes),
      };
    }

    // Handle 12-hour format (3:00 PM)
    const match = time.match(/(\d{1,2}):?(\d{0,2})\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2] || "0");
      const period = match[3].toUpperCase();

      if (period === "PM" && hours !== 12) {
        hours += 12;
      } else if (period === "AM" && hours === 12) {
        hours = 0;
      }

      return { hours, minutes };
    }

    return null;
  } catch (error) {
    console.error("Error parsing time string:", error);
    return null;
  }
}

/**
 * Parse date string like "tomorrow" or "2024-01-15"
 * @param {string} dateStr - Date string
 * @returns {string|null} Parsed date string or null
 */
function parseDateString(dateStr) {
  try {
    const date = dateStr.trim().toLowerCase();

    if (date === "today") {
      return new Date().toISOString().split("T")[0];
    }

    if (date === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split("T")[0];
    }

    // Handle specific dates (YYYY-MM-DD)
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }

    // Handle relative dates like "in 2 days"
    if (date.includes("day")) {
      const days = extractNumber(dateStr) || 1;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      return futureDate.toISOString().split("T")[0];
    }

    return null;
  } catch (error) {
    console.error("Error parsing date string:", error);
    return null;
  }
}
