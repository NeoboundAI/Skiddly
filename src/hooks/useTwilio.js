import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

const fetchTwilioNumbers = async () => {
  const response = await fetch("/api/twilio/numbers");
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch Twilio numbers");
  }
  return {
    numbers: data.numbers,
    hasNumbers: data.hasNumbers,
  };
};

export const useTwilio = () => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch: fetchNumbers,
  } = useQuery({
    queryKey: ["twilio-numbers"],
    queryFn: fetchTwilioNumbers,
    enabled: !!session?.user?.email,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const updateNumbersAfterConnection = () => {
    queryClient.invalidateQueries({ queryKey: ["twilio-numbers"] });
  };

  return {
    numbers: data?.numbers || [],
    hasNumbers: data?.hasNumbers || false,
    isLoading,
    error: error ? error.message : null,
    fetchNumbers,
    updateNumbersAfterConnection,
  };
};
