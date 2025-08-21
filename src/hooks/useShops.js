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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return query;
};

// Utility hook for shop connection updates
export const useShopConnection = () => {
  const queryClient = useQueryClient();

  const updateShopsAfterConnection = () => {
    // Invalidate and refetch shops data
    queryClient.invalidateQueries({ queryKey: ["shops"] });
  };

  return { updateShopsAfterConnection };
};
