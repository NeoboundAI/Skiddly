# API Logging Implementation Guide

This guide provides instructions for adding comprehensive logging to all API routes in the Skiddly.ai application.

## Overview

We've implemented a centralized logging system with the following components:

1. **Enhanced Logger** (`src/lib/logger.js`) - Winston-based logger with file rotation
2. **API Logger Utilities** (`src/lib/apiLogger.js`) - Helper functions for consistent logging
3. **Log Files** - Created in development and production modes

## Log Files Created

- `logs/combined-YYYY-MM-DD.log` - All log levels
- `logs/error-YYYY-MM-DD.log` - Error logs only

## Logging Functions Available

### Core API Logging

- `logApiRequest(method, path, userId, metadata)` - Log API request start
- `logApiSuccess(method, path, statusCode, userId, metadata)` - Log successful API calls
- `logApiError(method, path, statusCode, error, userId, metadata)` - Log API errors

### Authentication Logging

- `logAuthEvent(event, email, metadata)` - Log auth events (login, register, etc.)
- `logAuthFailure(method, path, email, reason, metadata)` - Log auth failures

### Database Logging

- `logDbOperation(operation, model, userId, metadata)` - Log database operations

### External API Logging

- `logExternalApi(service, operation, userId, metadata)` - Log external API calls
- `logExternalApiError(service, operation, error, userId, metadata)` - Log external API errors

### Business Logic Logging

- `logBusinessEvent(event, userId, metadata)` - Log business events

## Implementation Steps for Remaining Routes

### 1. Import the logging utilities

```javascript
import {
  logApiError,
  logApiSuccess,
  logAuthFailure,
  logDbOperation,
  logExternalApi,
  logExternalApiError,
  logBusinessEvent,
} from "@/lib/apiLogger";
```

### 2. Replace console.log/console.error statements

Replace all `console.log()` and `console.error()` statements with appropriate logging functions.

### 3. Add logging for key events

- Authentication checks
- Database operations
- External API calls
- Business logic events
- Error handling

## Routes That Need Logging Implementation

### Auth Routes

- [x] `/api/auth/register/route.js` - ✅ Completed
- [x] `/api/auth/verify-otp/route.js` - ✅ Completed
- [ ] `/api/auth/forgot-password/route.js`
- [ ] `/api/auth/reset-password/route.js`
- [ ] `/api/auth/resend-otp/route.js`
- [ ] `/api/auth/check-email/route.js`
- [ ] `/api/auth/complete-onboarding/route.js`
- [ ] `/api/auth/update-plan/route.js`

### Agent Routes

- [x] `/api/agents/route.js` - ✅ Completed
- [ ] `/api/agents/[id]/route.js`
- [ ] `/api/agents/default/route.js`
- [ ] `/api/agents/create-from-template/route.js`
- [ ] `/api/agents/[id]/update-vapi/route.js`

### Shopify Routes

- [x] `/api/shopify/connect/route.js` - ✅ Completed
- [x] `/api/shopify/webhooks/route.js` - ✅ Completed
- [ ] `/api/shopify/callback/route.js`
- [ ] `/api/shopify/shops/route.js`
- [ ] `/api/shopify/abandoned-carts/route.js`
- [ ] `/api/shopify/register-webhooks/route.js`
- [ ] `/api/shopify/remove-webhooks/route.js`

### Twilio Routes

- [x] `/api/twilio/numbers/route.js` - ✅ Completed
- [x] `/api/twilio/purchase/route.js` - ✅ Completed
- [ ] `/api/twilio/free-numbers/route.js`
- [ ] `/api/twilio/assign-free-number/route.js`
- [ ] `/api/twilio/import/route.js`

### VAPI Routes

- [x] `/api/vapi/assistants/route.js` - ✅ Completed
- [ ] `/api/vapi/assistants/[id]/route.js`

### Admin Routes

- [x] `/api/admin/logs/route.js` - ✅ Already had logging

### Handler Files

- [ ] `/api/handlers/twilio.js`

## Example Implementation

Here's an example of how to implement logging in a typical API route:

```javascript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  logApiError,
  logApiSuccess,
  logAuthFailure,
  logDbOperation,
} from "@/lib/apiLogger";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logAuthFailure("GET", "/api/example", null, "No session or user email");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Your business logic here
    const result = await someOperation();

    logDbOperation("read", "ModelName", session.user.email, {
      count: result.length,
    });

    logApiSuccess("GET", "/api/example", 200, session.user.email, {
      resultCount: result.length,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    logApiError("GET", "/api/example", 500, error, session?.user?.email);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Testing the Logging

1. Start your development server
2. Make API calls to test routes
3. Check the log files in the `logs/` directory
4. Verify that logs are being written correctly

## Log Levels

- **error** - Errors that need immediate attention
- **warn** - Warning conditions
- **info** - General information about application flow
- **http** - HTTP request logging
- **debug** - Detailed debugging information

## Best Practices

1. **Always log errors** - Use `logApiError` for all error conditions
2. **Log authentication events** - Track login attempts, failures, and successes
3. **Log external API calls** - Monitor third-party service interactions
4. **Include relevant metadata** - Add context like user IDs, operation details
5. **Don't log sensitive data** - Avoid logging passwords, tokens, or PII
6. **Use appropriate log levels** - Don't use error level for normal operations

## Monitoring

In production, you can monitor the logs using:

- File system monitoring
- Log aggregation services (ELK stack, Splunk, etc.)
- Cloud logging services (AWS CloudWatch, Google Cloud Logging, etc.)

## Next Steps

1. Implement logging in the remaining routes following the patterns shown
2. Test the logging system thoroughly
3. Set up log monitoring and alerting for production
4. Consider adding structured logging for better analysis
