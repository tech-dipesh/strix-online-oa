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

export function useUploadZip(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (zipFile: File) => {
      const formData = new FormData();
      formData.append("file", zipFile);
      return apiRequest<FilePublic[]>(`/projects/${projectId}/files/upload-zip`, {
        method: "POST",
        body: formData,
        isFormData: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", projectId] });
    },
  });
}

export function useUploadFiles(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (droppedFiles: File[]) => {
      const formData = new FormData();
      droppedFiles.forEach((file) => formData.append("files", file));
      return apiRequest<FilePublic[]>(`/projects/${projectId}/files/upload`, {
        method: "POST",
        body: formData,
        isFormData: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", projectId] });
    },
  });
}
