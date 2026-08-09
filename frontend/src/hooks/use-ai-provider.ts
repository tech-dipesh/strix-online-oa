import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { AIProviderInput } from "@/lib/schemas";
import type { AIProviderPublic } from "@/lib/types";

export function useAIProvider() {
  return useQuery({
    queryKey: ["ai-provider"],
    queryFn: () => apiRequest<AIProviderPublic | null>("/ai-providers"),
  });
}

export function useSaveAIProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AIProviderInput) =>
      apiRequest<AIProviderPublic>("/ai-providers", { method: "PUT", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-provider"] });
    },
  });
}
