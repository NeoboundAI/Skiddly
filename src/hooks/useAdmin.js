import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAdminStore from "@/stores/adminStore";

// Fetch admin logs with enhanced filtering and pagination
export const useAdminLogs = (customFilters = {}) => {
  const {
    filters,
    setLogs,
    setLogsLoading,
    setLogsError,
    setPagination,
    setSummary,
  } = useAdminStore();

  return useQuery({
    queryKey: ["admin-logs", { ...filters, ...customFilters }],
    queryFn: async () => {
      setLogsLoading(true);
      setLogsError(null);

      try {
        // Build query parameters
        const queryParams = new URLSearchParams();

        // Add filters
        if (filters.level) queryParams.append("level", filters.level);
        if (filters.userEmail)
          queryParams.append("userEmail", filters.userEmail);
        if (filters.userId) queryParams.append("userId", filters.userId);
        if (filters.date) queryParams.append("date", filters.date);
        if (filters.search) queryParams.append("search", filters.search);

        // Add pagination
        if (filters.page) queryParams.append("page", filters.page.toString());
        if (filters.limit)
          queryParams.append("limit", filters.limit.toString());

        // Add custom filters
        Object.entries(customFilters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value.toString());
        });

        const response = await fetch(
          `/api/admin/logs?${queryParams.toString()}`
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to fetch logs");
        }

        const data = await response.json();

        // Update store with new data
        setLogs(data.logs || []);
        setPagination(data.pagination || {});
        setSummary(data.summary || {});

        return data;
      } catch (error) {
        setLogsError(error.message);
        throw error;
      } finally {
        setLogsLoading(false);
      }
    },
    enabled: false, // Don't auto-fetch, require manual trigger
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch admin stats
export const useAdminStats = () => {
  const { setStats, setStatsLoading } = useAdminStore();

  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      setStatsLoading(true);

      try {
        // TODO: Replace with actual stats API
        // For now, return mock data
        const mockStats = {
          totalUsers: 1247,
          activeUsers: 892,
          totalErrors: 23,
          systemHealth: "healthy",
        };

        setStats(mockStats);
        return mockStats;
      } catch (error) {
        throw error;
      } finally {
        setStatsLoading(false);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Create admin user
export const useCreateAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adminData) => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create admin");
      }

      const data = await response.json();
      return data.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};
