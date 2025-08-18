# Webhook Setup Guide

## Overview

Shopify webhooks require HTTPS URLs for security. This guide explains how to set up webhooks for both development and production environments.

## Development Setup

### Option 1: Using ngrok (Recommended)

1. Install ngrok: `npm install -g ngrok`
2. Start your Next.js app: `npm run dev`
3. In another terminal, run: `ngrok http 3000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)
5. Add to your `.env.local`:
   ```
   WEBHOOK_URL=https://abc123.ngrok-free.app
   ```

### Option 2: Skip Webhooks in Development

If you don't need real-time webhook functionality during development:

- Webhooks will be automatically skipped
- You can still test abandoned cart functionality manually
- Set `WEBHOOK_URL` when ready to test webhooks

## Production Setup

### Automatic Setup

- Webhooks are automatically registered when users connect their Shopify store
- Uses `NEXTAUTH_URL` environment variable (must be HTTPS)
- No manual configuration required

### Environment Variables

```env
# Required for production
NEXTAUTH_URL=https://yourdomain.com

# Optional for development
WEBHOOK_URL=https://your-ngrok-url.ngrok-free.app
```

## Webhook Topics Registered

- `CHECKOUTS_CREATE` - When a customer starts checkout
- `CHECKOUTS_UPDATE` - When checkout is updated
- `ORDERS_CREATE` - When an order is completed

## Troubleshooting

### "protocol http:// is not supported"

- **Cause**: Using HTTP URL for webhooks
- **Solution**: Use HTTPS URL or set `WEBHOOK_URL` for development

### Webhooks not registering

- **Check**: Shopify app permissions include webhook access
- **Check**: Environment variables are set correctly
- **Check**: Network connectivity to Shopify

### Development vs Production

- **Development**: May skip webhooks if HTTPS not available
- **Production**: Always registers webhooks automatically

## Manual Webhook Registration

If webhook registration fails during the initial OAuth process, you can manually register them using the provided tools.

### Using the Dashboard Component

The application includes a `WebhookStatus` component that can be added to your dashboard:

```jsx
import WebhookStatus from "@/components/WebhookStatus";

// In your dashboard component
<WebhookStatus user={user} />;
```

This component will:

- Show the current webhook registration status
- Display detailed information about each webhook
- Provide a manual registration button if webhooks are not active
- Show success/error messages after registration attempts

### Using the API Directly

Make a POST request to `/api/shopify/register-webhooks`:

```json
{
  "shop": "your-shop.myshopify.com",
  "accessToken": "your-access-token"
}
```

### Manual Shopify Admin Setup

If you need to manually register webhooks in Shopify admin:

1. Go to Shopify Admin → Settings → Notifications → Webhooks
2. Add webhook for each topic:
   - `CHECKOUTS_CREATE`
   - `CHECKOUTS_UPDATE`
   - `ORDERS_CREATE`
3. Set URL to: `https://yourdomain.com/api/shopify/webhooks`
4. Set format to: `JSON`

## Testing Webhooks

1. Connect your Shopify store
2. Create a test checkout and abandon it
3. Check the orders page for abandoned cart data
4. Complete an order to test order webhook
