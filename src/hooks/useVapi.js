import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Fetch VAPI assistant template
export const useVapiAssistant = (assistantId) => {
  return useQuery({
    queryKey: ["vapi-assistant", assistantId],
    queryFn: async () => {
      console.log("🔍 Fetching VAPI assistant template with ID:", assistantId);
      const response = await fetch(`/api/vapi/assistants/${assistantId}`);
      if (!response.ok) {
        console.error(
          "❌ Failed to fetch VAPI assistant:",
          response.status,
          response.statusText
        );
        throw new Error("Failed to fetch VAPI assistant");
      }
      const data = await response.json();
      console.log(
        "✅ VAPI assistant template fetched successfully:",
        data.data
      );
      return data.data;
    },
    enabled: !!assistantId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Create VAPI assistant
export const useCreateVapiAssistant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assistantData) => {
      console.log("🔧 Creating VAPI assistant with data:", assistantData);
      const response = await fetch("/api/vapi/assistants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assistantData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Failed to create VAPI assistant:", error);
        throw new Error(error.error || "Failed to create VAPI assistant");
      }

      const data = await response.json();
      console.log("✅ VAPI assistant created successfully:", data.data);
      return data.data;
    },
    onSuccess: () => {
      console.log("🔄 Invalidating agents query cache...");
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
};
