import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Fetch agents
export const useAgents = (shopId = null) => {
  return useQuery({
    queryKey: ["agents", shopId],
    queryFn: async () => {
      const url = shopId ? `/api/agents?shopId=${shopId}` : "/api/agents";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch agents");
      }
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Create agent
export const useCreateAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentData) => {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(agentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create agent");
      }

      const data = await response.json();
      return data.data;
    },
    onSuccess: () => {
      // Invalidate agents query
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
};
