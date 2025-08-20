# Shopify Multi-Shop Architecture

## Overview

The Shopify integration has been refactored to support multiple Shopify shops per user. Previously, Shopify connection data was embedded directly in the User model. Now, it's stored in a separate `ShopifyShop` collection.

## Changes Made

### 1. New ShopifyShop Model

Created `src/models/ShopifyShop.js` with the following structure:

```javascript
{
  userId: ObjectId,           // Reference to User
  shop: String,              // Shop domain (e.g., "my-shop.myshopify.com")
  accessToken: String,       // Shopify access token
  scope: String,            // OAuth scopes
  isActive: Boolean,        // Connection status
  connectedAt: Date,        // When connection was established
  webhooksRegistered: Boolean,
  webhookRegistrationDate: Date,
  registeredWebhooks: Array,
  oauthState: String,       // For OAuth flow
  oauthNonce: String,       // For OAuth flow
}
```

### 2. Updated User Model

Removed Shopify-specific fields from the User model:

- `shopify.shop`
- `shopify.accessToken`
- `shopify.scope`
- `shopify.state`
- `shopify.isActive`
- `shopify.connectedAt`
- `shopify.webhooksRegistered`
- `shopify.webhookRegistrationDate`
- `shopify.registeredWebhooks`

### 3. Updated API Routes

#### `/api/shopify/connect`

- Now creates/updates records in `ShopifyShop` collection
- Checks for existing connections per user
- Stores OAuth state in the shop connection record

#### `/api/shopify/callback`

- Finds shop connection by OAuth state
- Updates shop connection with access token
- Registers webhooks for the specific shop

#### `/api/shopify/register-webhooks`

- Finds shop connection by shop domain
- Updates webhook status for the specific shop

#### `/api/shopify/remove-webhooks`

- Finds shop connection by shop domain
- Removes webhooks for the specific shop

#### `/api/shopify/abandoned-carts`

- Supports shop selection via query parameter
- Falls back to first active connection if no shop specified

#### `/api/shopify/shops` (NEW)

- `GET`: Returns all connected shops for the authenticated user
- `DELETE`: Deactivates a specific shop connection

### 4. Updated Frontend Components

#### Dashboard Page

- Now fetches shop connections via API call
- Updates onboarding status based on API response

#### Orders Page

- Removed dependency on `session.user.shopify`
- Uses API to fetch abandoned carts

#### WebhookStatus Component

- Fetches shop connections via API
- Shows webhook status for the first connected shop
- Supports multiple shops (shows first one for now)

### 5. Helper Functions

Added to `src/lib/shopify.js`:

- `getShopInfo(shop, accessToken)`: Fetch shop information
- `validateShopDomain(shop)`: Validate shop domain format

## Migration

### Running the Migration

1. **Backup your database** before running the migration
2. Run the migration script:

```bash
node src/scripts/migrate-shopify-data.js
```

The migration script will:

- Find all users with existing Shopify connections
- Create new `ShopifyShop` records for each connection
- Remove Shopify data from User documents
- Preserve all existing webhook and connection data

### Manual Migration Steps

If you prefer to migrate manually:

1. Create `ShopifyShop` records for existing connections
2. Update API calls to use the new endpoints
3. Remove Shopify fields from User documents
4. Test the new functionality

## API Usage Examples

### Get Connected Shops

```javascript
const response = await fetch("/api/shopify/shops");
const { data: shops } = await response.json();
```

### Get Abandoned Carts for Specific Shop

```javascript
const response = await fetch(
  "/api/shopify/abandoned-carts?shop=my-shop.myshopify.com"
);
const { data: carts } = await response.json();
```

### Deactivate Shop Connection

```javascript
const response = await fetch("/api/shopify/shops", {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ shop: "my-shop.myshopify.com" }),
});
```

## Benefits

1. **Multiple Shops**: Users can now connect multiple Shopify stores
2. **Better Organization**: Shop data is separated from user data
3. **Scalability**: Easier to manage and query shop-specific data
4. **Flexibility**: Can easily add shop-specific features
5. **Data Integrity**: Proper indexing and constraints

## Future Enhancements

1. **Shop Selection UI**: Add dropdown to select which shop to work with
2. **Shop Management**: Add UI to manage multiple shops
3. **Shop-specific Settings**: Allow different configurations per shop
4. **Bulk Operations**: Support operations across multiple shops

## Testing

After migration, test the following:

1. **Shop Connection**: Connect a new Shopify store
2. **Webhook Registration**: Verify webhooks are registered correctly
3. **Data Fetching**: Check that abandoned carts are fetched properly
4. **Multiple Shops**: Connect multiple shops and verify they work independently

## Rollback Plan

If issues arise, you can rollback by:

1. Restoring the User model to include Shopify fields
2. Updating API routes to use the old structure
3. Restoring frontend components to use `session.user.shopify`
4. Running a reverse migration script (if needed)

## Support

For issues or questions about the new architecture, check:

- API response logs
- Database connection status
- OAuth flow completion
- Webhook registration status
