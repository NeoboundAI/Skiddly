import { create } from "zustand";

const useShopStore = create((set, get) => ({
  // State
  selectedShop: null,

  // Actions
  setSelectedShop: (shop) => set({ selectedShop: shop }),

  // Utility actions
  clearShops: () => set({ selectedShop: null }),
}));

export default useShopStore;
