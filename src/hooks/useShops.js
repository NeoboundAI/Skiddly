import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

const fetchShops = async () => {
  const response = await fetch("/api/shopify/shops");

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch shops: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.data || [];
};

export const useShops = () => {
  const { data: session, status } = useSession();

  const query = useQuery({
    queryKey: ["shops"],
    queryFn: fetchShops,
    enabled: !!session?.user, // Only fetch when user is authenticated
    gcTime: 5 * 60 * 1000, // 5 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  return query;
};

// Utility hook for shop connection updates
export const useShopConnection = () => {
  const queryClient = useQueryClient();

  const invalidateShops = () => {
    queryClient.invalidateQueries({ queryKey: ["shops"] });
  };

  const refetchShops = async () => {
    await queryClient.refetchQueries({ queryKey: ["shops"] });
  };

  const updateShopsAfterConnection = async () => {
    // Force refetch to get fresh data after new shop connection
    await queryClient.refetchQueries({ queryKey: ["shops"] });
  };

  return {
    invalidateShops,
    refetchShops,
    updateShopsAfterConnection,
  };
};
