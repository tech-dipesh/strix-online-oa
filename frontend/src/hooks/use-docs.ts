import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { DocType, GeneratedDocPublic } from "@/lib/types";

export function useGenerateDoc(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (docType: DocType) =>
      apiRequest<GeneratedDocPublic>(`/projects/${projectId}/docs`, {
        method: "POST",
        body: { doc_type: docType },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docs", projectId] });
    },
  });
}

export function useGeneratedDocs(projectId: string) {
  return useQuery({
    queryKey: ["docs", projectId],
    queryFn: () => apiRequest<GeneratedDocPublic[]>(`/projects/${projectId}/docs`),
  });
}
