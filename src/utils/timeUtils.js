/**
 * Utility functions for time formatting and manipulation
 */

/**
 * Format a date to a readable string with local time
 * Example: "2025-09-10 15:30:45 (UTC+5:30)"
 */
export function formatReadableTime(date) {
  if (!date) return "N/A";

  const d = new Date(date);

  // Get local date/time components
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  // Get timezone offset
  const timezoneOffset = d.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
  const offsetMinutes = Math.abs(timezoneOffset) % 60;
  const offsetSign = timezoneOffset <= 0 ? "+" : "-";
  const timezone = `UTC${offsetSign}${String(offsetHours).padStart(
    2,
    "0"
  )}:${String(offsetMinutes).padStart(2, "0")}`;

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (${timezone})`;
}

/**
 * Format a date to a compact readable string
 * Example: "09/10 15:30:45"
 */
export function formatCompactTime(date) {
  if (!date) return "N/A";

  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return `${month}/${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Format a date to time only
 * Example: "15:30:45"
 */
export function formatTimeOnly(date) {
  if (!date) return "N/A";

  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}
