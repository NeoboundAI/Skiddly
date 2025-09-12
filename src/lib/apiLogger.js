import logger from "./logger";

/**
 * Extract user information from various input types
 * @param {string|object|null} userInfo - User email, ID, or session object
 * @returns {object} - Object with userId and userEmail
 */
const extractUserInfo = (userInfo) => {
  if (!userInfo) return { userId: null, userEmail: null };

  if (typeof userInfo === "string") {
    // If it's just an email string
    return { userId: null, userEmail: userInfo };
  }

  if (typeof userInfo === "object") {
    return {
      userId: userInfo.id || userInfo._id?.toString() || null,
      userEmail: userInfo.email || null,
    };
  }

  return { userId: null, userEmail: null };
};

/**
 * Log API request
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {string|object} userInfo - User information
 * @param {object} metadata - Additional metadata
 */
export const logApiRequest = (method, path, userInfo = null, metadata = {}) => {
  const { userId, userEmail } = extractUserInfo(userInfo);

  logger.info(`API Request: ${method} ${path}`, {
    method,
    path,
    userId,
    userEmail,
    ...metadata,
  });
};

/**
 * Log API success
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {number} statusCode - Response status code
 * @param {string|object} userInfo - User information
 * @param {object} metadata - Additional metadata
 */
export const logApiSuccess = (
  method,
  path,
  statusCode,
  userInfo = null,
  metadata = {}
) => {
  const { userId, userEmail } = extractUserInfo(userInfo);

  logger.info(`API Success: ${method} ${path} - ${statusCode}`, {
    method,
    path,
    statusCode,
    userId,
    userEmail,
    ...metadata,
  });
};

/**
 * Log API error with enhanced stack trace information
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {number} statusCode - Response status code
 * @param {Error|string} error - Error object or message
 * @param {string|object} userInfo - User information
 * @param {object} metadata - Additional metadata
 */
export const logApiError = (
  method,
  path,
  statusCode,
  error,
  userInfo = null,
  metadata = {}
) => {
  const { userId, userEmail } = extractUserInfo(userInfo);

  // Enhanced error information
  const errorInfo = {
    message: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : null,
    name: error instanceof Error ? error.name : null,
    // Capture additional error details
    code: error instanceof Error ? error.code : null,
    fileName: error instanceof Error ? error.fileName : null,
    lineNumber: error instanceof Error ? error.lineNumber : null,
  };

  logger.error(`API Error: ${method} ${path} - ${statusCode}`, {
    method,
    path,
    statusCode,
    userId,
    userEmail,
    error: errorInfo.message,
    stack: errorInfo.stack,
    errorName: errorInfo.name,
    errorCode: errorInfo.code,
    fileName: errorInfo.fileName,
    lineNumber: errorInfo.lineNumber,
    // Include full error object for development
    fullError: process.env.NODE_ENV !== "production" ? error : undefined,
    // Include request details for debugging
    requestUrl: process.env.NODE_ENV !== "production" ? path : undefined,
    requestMethod: process.env.NODE_ENV !== "production" ? method : undefined,
    ...metadata,
  });
};

/**
 * Log authentication events
 * @param {string} event - Event type (login, logout, register, etc.)
 * @param {string|object} userInfo - User email, ID, or session object
 * @param {object} metadata - Additional metadata
 */
export const logAuthEvent = (event, userInfo = null, metadata = {}) => {
  const { userId, userEmail } = extractUserInfo(userInfo);

  logger.info(`Auth Event: ${event}`, {
    event,
    userId,
    userEmail,
    ...metadata,
  });
};

/**
 * Log authentication failures
 * @param {string} reason - Reason for failure
 * @param {string|object} userInfo - User information
 * @param {object} metadata - Additional metadata
 */
export const logAuthFailure = (reason, userInfo = null, metadata = {}) => {
  const { userId, userEmail } = extractUserInfo(userInfo);

  logger.warn(`Auth Failure: ${reason}`, {
    reason,
    userId,
    userEmail,
    ...metadata,
  });
};

/**
 * Log database operations
 * @param {string} operation - Operation type (create, read, update, delete)
 * @param {string} model - Model name
 * @param {string|object} userInfo - User information
 * @param {object} metadata - Additional metadata
 */
export const logDbOperation = (
  operation,
  model,
  userInfo = null,
  metadata = {}
) => {
  const { userId, userEmail } = extractUserInfo(userInfo);

  logger.info(`DB Operation: ${operation} ${model}`, {
    operation,
    model,
    userId,
    userEmail,
    ...metadata,
  });
};

/**
 * Log external API calls
 * @param {string} service - Service name (e.g., "Shopify", "Twilio")
 * @param {string} operation - Operation being performed
 * @param {string|object} userInfo - User information
 * @param {object} metadata - Additional metadata
 */
export const logExternalApi = (
  service,
  operation,
  userInfo = null,
  metadata = {}
) => {
  const { userId, userEmail } = extractUserInfo(userInfo);

  logger.info(`External API: ${service} - ${operation}`, {
    service,
    operation,
    userId,
    userEmail,
    ...metadata,
  });
};

/**
 * Log external API errors with enhanced error details
 * @param {string} service - Service name
 * @param {string} operation - Operation being performed
 * @param {Error|string} error - Error object or message
 * @param {string|object} userInfo - User information
 * @param {object} metadata - Additional metadata
 */
export const logExternalApiError = (
  service,
  operation,
  error,
  userInfo = null,
  metadata = {}
) => {
  const { userId, userEmail } = extractUserInfo(userInfo);

  // Enhanced error information
  const errorInfo = {
    message: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : null,
    name: error instanceof Error ? error.name : null,
    code: error instanceof Error ? error.code : null,
  };

  logger.error(`External API Error: ${service} - ${operation}`, {
    service,
    operation,
    userId,
    userEmail,
    error: errorInfo.message,
    stack: errorInfo.stack,
    errorName: errorInfo.name,
    errorCode: errorInfo.code,
    // Include full error object for development
    fullError: process.env.NODE_ENV !== "production" ? error : undefined,
    ...metadata,
  });
};

/**
 * Log business events
 * @param {string} event - Business event name
 * @param {string|object} userInfo - User information
 * @param {object} metadata - Additional metadata
 */
export const logBusinessEvent = (event, userInfo = null, metadata = {}) => {
  const { userId, userEmail } = extractUserInfo(userInfo);

  logger.info(`Business Event: ${event}`, {
    event,
    userId,
    userEmail,
    ...metadata,
  });
};

/**
 * Wrapper function to log API route execution
 * @param {Function} handler - API route handler function
 * @param {string} routeName - Name of the route for logging
 * @returns {Function} - Wrapped handler function
 */
export const withApiLogging = (handler, routeName) => {
  return async (request, context) => {
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;
    const startTime = Date.now();

    let userInfo = null;

    try {
      // Get session for user identification (each route should handle this)
      const { getServerSession } = await import("next-auth");
      const { authOptions } = await import("@/lib/auth");
      const session = await getServerSession(authOptions);
      userInfo = session?.user || null;

      logApiRequest(method, path, userInfo, { routeName });

      const response = await handler(request, context);

      const duration = Date.now() - startTime;
      logApiSuccess(method, path, response.status, userInfo, {
        routeName,
        duration: `${duration}ms`,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      logApiError(method, path, 500, error, userInfo, {
        routeName,
        duration: `${duration}ms`,
      });

      // Re-throw the error to maintain original behavior
      throw error;
    }
  };
};
