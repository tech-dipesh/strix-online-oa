import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { ReviewPublic, ReviewType } from "@/lib/types";

interface CreateReviewInput {
  review_type: ReviewType;
  file_ids?: string[] | null;
}

export function useCreateReview(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReviewInput) =>
      apiRequest<ReviewPublic>(`/projects/${projectId}/reviews`, {
        method: "POST",
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", projectId] });
    },
  });
}

export function useReviews(projectId: string, filters: { reviewType?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters.reviewType) params.set("review_type", filters.reviewType);
  if (filters.search) params.set("search", filters.search);
  const queryString = params.toString();

  return useQuery({
    queryKey: ["reviews", projectId, filters.reviewType ?? "", filters.search ?? ""],
    queryFn: () =>
      apiRequest<ReviewPublic[]>(
        `/projects/${projectId}/reviews${queryString ? `?${queryString}` : ""}`,
      ),
  });
}

export function useReview(projectId: string, reviewId: string) {
  return useQuery({
    queryKey: ["review", projectId, reviewId],
    queryFn: () => apiRequest<ReviewPublic>(`/projects/${projectId}/reviews/${reviewId}`),
  });
}
