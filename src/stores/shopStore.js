import { create } from "zustand";
import { persist } from "zustand/middleware";

const useShopStore = create(
  persist(
    (set, get) => ({
      // State
      selectedShop: null,

      // Actions
      setSelectedShop: (shop) => set({ selectedShop: shop }),

      // Utility actions
      clearShops: () => set({ selectedShop: null }),
    }),
    {
      name: "shop-storage", // unique name for localStorage key
      partialize: (state) => ({ selectedShop: state.selectedShop }), // only persist selectedShop
    }
  )
);

export default useShopStore;
