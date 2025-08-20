# Zustand + React Query Shop Management

## Overview

The application uses a hybrid approach combining React Query for data fetching with persistence and Zustand for global state management. This provides optimal performance and user experience.

## Features

### 1. React Query Hook (`src/hooks/useShops.js`)

- **Data Fetching**: Handles API calls with automatic caching
- **Persistence**: Cache persists across page reloads
- **Optimization**: Smart refetching and background updates
- **Error Handling**: Built-in error states and retries
- **State Updates**: Automatic cache invalidation and refetching
- **Connection Updates**: Utility functions for shop connection changes

### 2. Zustand Store (`src/stores/shopStore.js`)

- **State Management**: Manages selected shop state
- **Persistence**: Automatic localStorage persistence for selected shop
- **Simplicity**: Lightweight state management

### 3. Architecture Structure

```javascript
// React Query Hook
const { data: shops, isLoading, refetch } = useShops();

// Zustand Store
const { selectedShop, setSelectedShop } = useShopStore();

// Shop Connection Utility
const { updateShopsAfterConnection } = useShopConnection();

// Combined Usage
const shops = useShops().data || [];
const selectedShop = useShopStore().selectedShop;
```

## Usage

### Basic Usage

```javascript
import { useShops } from "@/hooks/useShops";
import useShopStore from "@/stores/shopStore";

const MyComponent = () => {
  const { data: shops = [], isLoading } = useShops();
  const { selectedShop, setSelectedShop } = useShopStore();

  // Access data
  console.log(selectedShop?.shop);

  // Update state
  setSelectedShop(shops[1]);
};
```

### Data Fetching with React Query

```javascript
const { data: shops, isLoading, error, refetch } = useShops();

// Data is automatically cached and persisted
// Refetch when needed (e.g., after connecting new shop)
await refetch();
```

### Shop Connection Updates

```javascript
const { updateShopsAfterConnection } = useShopConnection();

// After connecting a new shop
onSuccess={() => {
  updateShopsAfterConnection(); // Invalidates cache and refetches
}}
```

### Making API Calls with Selected Shop

```javascript
const { selectedShop } = useShopStore();

// Fetch data for selected shop
const response = await fetch(
  `/api/shopify/abandoned-carts?shop=${selectedShop.shop}`
);
```

## Components Updated

### 1. ShopSelector

- Uses `useShops()` for data fetching
- Uses `useShopStore()` for selected shop state
- Refetches data after connecting new shop

### 2. DashboardLayout

- Uses `useShops()` for data fetching
- Auto-selects first shop when available
- Clears cache on logout

### 3. Orders Page

- Uses Zustand store for selected shop
- Shop-specific API calls

### 4. WebhookStatus

- Uses Zustand store for selected shop
- Shop-specific webhook management

### 5. Dashboard Page

- Uses `useShops()` for shop data
- Updates onboarding status based on shops

## Benefits of Hybrid Approach

### 1. React Query Benefits

- **Automatic Caching**: Data is cached and persisted
- **Background Updates**: Smart refetching strategies
- **Error Handling**: Built-in error states and retries
- **Optimistic Updates**: Immediate UI updates

### 2. Zustand Benefits

- **Lightweight State**: Simple state management
- **Persistence**: Selected shop persists across sessions
- **Performance**: Minimal re-renders
- **Developer Experience**: Easy debugging

### 3. Combined Benefits

- **Best of Both**: Data fetching + state management
- **Performance**: Cached data + minimal re-renders
- **User Experience**: Fast navigation + persistent state
- **Developer Experience**: Clear separation of concerns

## Data Persistence

### React Query Persistence

- **Cache Storage**: localStorage with `react-query-cache` key
- **Automatic**: Cache is saved before page unload and restored on mount
- **Smart**: Only successful queries are persisted
- **Performance**: Fast cache restoration

### Zustand Persistence

- **Key**: `shop-storage`
- **Persisted Data**: `selectedShop` (currently selected shop)
- **Automatic**: No manual persistence handling required

## Caching Strategy

### React Query Caching

- **Stale Time**: 5 minutes (data considered fresh)
- **GC Time**: 10 minutes (cache garbage collection)
- **Background Updates**: Automatic refetching when data becomes stale
- **Route Navigation**: No re-fetching when switching routes

### Cache Behavior

- **Initial Load**: Fetches shops once and caches
- **Route Changes**: Uses cached data (no API calls)
- **Manual Refresh**: `refetch()` for fresh data
- **Shop Connection**: Automatically invalidates cache and refetches
- **Page Refresh**: Refetches on mount to ensure fresh data
- **Logout**: Clears both React Query and Zustand cache
- **Page Reload**: Restores cache from localStorage

## Migration from Context

### Before (React Context)

```javascript
// Provider wrapper required
<ShopProvider>
  <DashboardLayout>
    <Component />
  </DashboardLayout>
</ShopProvider>;

// Usage in components
const { selectedShop } = useShop();
```

### After (Zustand)

```javascript
// No provider required
<DashboardLayout>
  <Component />
</DashboardLayout>;

// Usage in components
const { selectedShop } = useShopStore();
```

## Testing

### Manual Testing Checklist

- [ ] Connect first Shopify shop
- [ ] Verify shop appears in dropdown
- [ ] Connect second Shopify shop
- [ ] Verify both shops appear in dropdown
- [ ] Switch between shops
- [ ] Verify data updates for selected shop
- [ ] Refresh page and verify selection persists
- [ ] Test with no shops connected
- [ ] Test with collapsed sidebar

### Store Testing

```javascript
import { renderHook, act } from "@testing-library/react";
import useShopStore from "@/stores/shopStore";

test("should select shop", () => {
  const { result } = renderHook(() => useShopStore());

  act(() => {
    result.current.selectShop(mockShop);
  });

  expect(result.current.selectedShop).toBe(mockShop);
});
```

## Troubleshooting

### Common Issues

1. **Store not updating**: Check if you're using the correct selector
2. **Persistence not working**: Verify localStorage permissions
3. **Component not re-rendering**: Ensure you're subscribing to the correct state slice
4. **"Shop already connected" error**: Run cleanup script to remove incomplete connections
5. **Shops not refreshing**: Use `refreshShops()` or `fetchShops(true)` to force refresh
6. **Cache issues**: Check cache info with `getCacheInfo()` for debugging

### Debug Information

- Store state available in Redux DevTools
- localStorage key: `shop-storage`
- Console logs for API errors
- Cache info: `getCacheInfo()` function
- Cache status: `isCacheStale()` function

### Fixing Incomplete Connections

If users encounter "Shop already connected" errors due to cancelled OAuth flows:

1. **Run cleanup script**:

   ```bash
   node src/scripts/cleanup-incomplete-shopify.js
   ```

2. **Automatic cleanup**: The system now automatically cleans up incomplete connections:
   - On connection attempts (removes incomplete connections)
   - On OAuth errors/cancellations
   - When fetching shops (removes incomplete connections for the user)
   - Old incomplete connections (older than 1 hour) are automatically removed

## Future Enhancements

1. **Shop Management**: Add disconnect shop functionality
2. **Shop Analytics**: Compare performance across shops
3. **Bulk Operations**: Actions across multiple shops
4. **Shop Templates**: Apply settings to multiple shops
5. **Advanced Persistence**: Sync with backend preferences
