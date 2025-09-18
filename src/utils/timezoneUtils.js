/**
 * Simple timezone detection for US and India phone numbers
 */

/**
 * Get timezone from phone number (US or India only)
 * @param {string} phoneNumber - Phone number with country code
 * @returns {string} Timezone identifier
 */
export function getTimezoneFromPhoneNumber(phoneNumber) {
  if (!phoneNumber) return "UTC";

  // Clean the phone number
  const cleanNumber = phoneNumber.replace(/\D/g, "");

  // Check for US numbers (+1)
  if (cleanNumber.startsWith("1") && cleanNumber.length === 11) {
    return "America/New_York"; // EST/EDT
  }

  // Check for India numbers (+91)
  if (cleanNumber.startsWith("91") && cleanNumber.length === 12) {
    return "Asia/Kolkata"; // IST
  }

  // Fallback to UTC
  return "UTC";
}

/**
 * Get timezone offset in hours from UTC
 * @param {string} timezone - Timezone identifier
 * @returns {number} Offset in hours
 */
export function getTimezoneOffset(timezone) {
  const now = new Date();
  const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const local = new Date(utc.toLocaleString("en-US", { timeZone: timezone }));
  return (local.getTime() - utc.getTime()) / (1000 * 60 * 60);
}

/**
 * Convert time from customer timezone to agent timezone
 * @param {string} customerTime - Time in customer timezone (HH:MM format)
 * @param {string} customerTimezone - Customer timezone
 * @param {string} agentTimezone - Agent timezone
 * @param {string} date - Date (YYYY-MM-DD format)
 * @returns {Date} Converted time in agent timezone
 */
export function convertTimeToAgentTimezone(
  customerTime,
  customerTimezone,
  agentTimezone,
  date
) {
  try {
    // Create date-time string in customer timezone
    const dateTimeString = `${date} ${customerTime}`;

    // Parse as if it's in customer timezone
    const customerDate = new Date(dateTimeString);

    // Convert to agent timezone
    const agentDate = new Date(
      customerDate.toLocaleString("en-US", { timeZone: agentTimezone })
    );

    return agentDate;
  } catch (error) {
    console.error("Error converting timezone:", error);
    return new Date();
  }
}

/**
 * Check if time is within agent's business hours
 * @param {Date} callTime - Time to check
 * @param {string} agentTimezone - Agent timezone
 * @param {string} startTime - Business start time (HH:MM)
 * @param {string} endTime - Business end time (HH:MM)
 * @returns {boolean} True if within business hours
 */
export function isWithinBusinessHours(
  callTime,
  agentTimezone,
  startTime,
  endTime
) {
  try {
    // Convert call time to agent timezone
    const agentTime = new Date(
      callTime.toLocaleString("en-US", { timeZone: agentTimezone })
    );

    // Get current date in agent timezone
    const today = new Date().toLocaleDateString("en-US", {
      timeZone: agentTimezone,
    });

    // Create start and end times for today
    const startDateTime = new Date(`${today} ${startTime}`);
    const endDateTime = new Date(`${today} ${endTime}`);

    // Check if call time is within business hours
    return agentTime >= startDateTime && agentTime <= endDateTime;
  } catch (error) {
    console.error("Error checking business hours:", error);
    return false;
  }
}

/**
 * Get next available business time
 * @param {string} agentTimezone - Agent timezone
 * @param {string} startTime - Business start time (HH:MM)
 * @param {string} endTime - Business end time (HH:MM)
 * @param {boolean} weekendCalling - Whether weekend calling is allowed
 * @returns {Date} Next available business time
 */
export function getNextBusinessTime(
  agentTimezone,
  startTime,
  endTime,
  weekendCalling = false
) {
  try {
    const now = new Date();
    const agentNow = new Date(
      now.toLocaleString("en-US", { timeZone: agentTimezone })
    );

    // Get current day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = agentNow.getDay();

    // Check if it's weekend and weekend calling is not allowed
    if (!weekendCalling && (dayOfWeek === 0 || dayOfWeek === 6)) {
      // Move to next Monday
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 2;
      agentNow.setDate(agentNow.getDate() + daysUntilMonday);
      agentNow.setHours(
        parseInt(startTime.split(":")[0]),
        parseInt(startTime.split(":")[1]),
        0,
        0
      );
    } else {
      // Check if current time is within business hours
      const currentTime = agentNow.getHours() * 60 + agentNow.getMinutes();
      const startTimeMinutes =
        parseInt(startTime.split(":")[0]) * 60 +
        parseInt(startTime.split(":")[1]);
      const endTimeMinutes =
        parseInt(endTime.split(":")[0]) * 60 + parseInt(endTime.split(":")[1]);

      if (currentTime < startTimeMinutes) {
        // Before business hours, schedule for start time today
        agentNow.setHours(
          parseInt(startTime.split(":")[0]),
          parseInt(startTime.split(":")[1]),
          0,
          0
        );
      } else if (currentTime >= endTimeMinutes) {
        // After business hours, schedule for start time tomorrow
        agentNow.setDate(agentNow.getDate() + 1);
        agentNow.setHours(
          parseInt(startTime.split(":")[0]),
          parseInt(startTime.split(":")[1]),
          0,
          0
        );
      }
    }

    return agentNow;
  } catch (error) {
    console.error("Error getting next business time:", error);
    return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  }
}
