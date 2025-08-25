import { create } from "zustand";
import { devtools } from "zustand/middleware";

const useAdminStore = create(
  devtools(
    (set, get) => ({
      // State
      logs: [],
      logsLoading: false,
      logsError: null,
      pagination: {
        page: 1,
        limit: 100,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      summary: {
        totalFiles: 0,
        totalEntries: 0,
        filteredEntries: 0,
      },
      filters: {
        level: "",
        userEmail: "",
        userId: "",
        search: "",
        date: "",
        page: 1,
        limit: 100,
      },
      stats: {
        totalUsers: 0,
        activeUsers: 0,
        totalErrors: 0,
        systemHealth: "healthy",
      },
      statsLoading: false,

      // Actions
      setLogs: (logs) => set({ logs }),
      setLogsLoading: (loading) => set({ logsLoading: loading }),
      setLogsError: (error) => set({ logsError: error }),
      setPagination: (pagination) => set({ pagination }),
      setSummary: (summary) => set({ summary }),

      setFilters: (filters) => set({ filters }),
      updateFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),

      setStats: (stats) => set({ stats }),
      setStatsLoading: (loading) => set({ statsLoading: loading }),

      // Utility actions
      clearLogs: () => set({ logs: [], logsError: null }),
      clearFilters: () =>
        set({
          filters: {
            level: "",
            userEmail: "",
            userId: "",
            search: "",
            date: "",
            page: 1,
            limit: 100,
          },
        }),

      // Pagination actions
      nextPage: () =>
        set((state) => ({
          filters: { ...state.filters, page: state.filters.page + 1 },
        })),

      prevPage: () =>
        set((state) => ({
          filters: {
            ...state.filters,
            page: Math.max(1, state.filters.page - 1),
          },
        })),

      setPage: (page) =>
        set((state) => ({
          filters: { ...state.filters, page },
        })),

      setLimit: (limit) =>
        set((state) => ({
          filters: { ...state.filters, limit, page: 1 }, // Reset to first page when changing limit
        })),
    }),
    {
      name: "admin-store",
    }
  )
);

export default useAdminStore;
