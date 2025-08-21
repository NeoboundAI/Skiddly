/**
 * Simple utility functions for clearing application caches
 */

export const clearAppCaches = (queryClient, clearShops) => {
  try {
    console.log("🧹 Clearing application caches...");

    // Clear Zustand store
    if (clearShops && typeof clearShops === "function") {
      clearShops();
      console.log("✅ Zustand store cleared");
    }

    // Clear React Query cache
    if (queryClient && typeof queryClient.clear === "function") {
      queryClient.clear();
      console.log("✅ React Query cache cleared");
    }

    console.log("✅ All caches cleared successfully");
    return true;
  } catch (error) {
    console.error("❌ Error clearing caches:", error);
    return false;
  }
};
