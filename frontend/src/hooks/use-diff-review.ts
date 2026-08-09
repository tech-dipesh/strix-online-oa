import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { DiffReviewPublic } from "@/lib/types";

export function useCreateDiffReview(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { file_id_a: string; file_id_b: string }) =>
      apiRequest<DiffReviewPublic>(`/projects/${projectId}/diff-reviews`, {
        method: "POST",
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diff-reviews", projectId] });
    },
  });
}

export function useDiffReviews(projectId: string) {
  return useQuery({
    queryKey: ["diff-reviews", projectId],
    queryFn: () => apiRequest<DiffReviewPublic[]>(`/projects/${projectId}/diff-reviews`),
  });
}
