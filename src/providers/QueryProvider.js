"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";

const QueryProvider = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  // Persist React Query cache to localStorage
  useEffect(() => {
    const handleBeforeUnload = () => {
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.getAll();
      const cacheData = {};

      queries.forEach((query) => {
        if (query.state.status === "success") {
          cacheData[query.queryHash] = {
            data: query.state.data,
            dataUpdatedAt: query.state.dataUpdatedAt,
          };
        }
      });

      localStorage.setItem("react-query-cache", JSON.stringify(cacheData));
    };

    // Restore cache from localStorage
    const restoreCache = () => {
      try {
        const cachedData = localStorage.getItem("react-query-cache");
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          Object.entries(parsedData).forEach(([queryHash, queryData]) => {
            queryClient.setQueryData(JSON.parse(queryHash), queryData.data);
          });
        }
      } catch (error) {
        console.error("Error restoring React Query cache:", error);
      }
    };

    // Restore cache on mount
    restoreCache();

    // Save cache before unload
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
};

export default QueryProvider;
