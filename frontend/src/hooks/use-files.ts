import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { FileContent, FilePublic } from "@/lib/types";

export function useFiles(projectId: string) {
  return useQuery({
    queryKey: ["files", projectId],
    queryFn: () => apiRequest<FilePublic[]>(`/projects/${projectId}/files`),
  });
}

export function useFileContent(projectId: string, fileId: string | null) {
  return useQuery({
    queryKey: ["file-content", projectId, fileId],
    queryFn: () => apiRequest<FileContent>(`/projects/${projectId}/files/${fileId}/content`),
    enabled: fileId !== null,
  });
}
