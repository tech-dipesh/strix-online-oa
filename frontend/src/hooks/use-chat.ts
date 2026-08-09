import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { ChatMessagePublic, ChatSessionPublic } from "@/lib/types";

export function useChatSessions(projectId: string) {
  return useQuery({
    queryKey: ["chat-sessions", projectId],
    queryFn: () => apiRequest<ChatSessionPublic[]>(`/projects/${projectId}/chat/sessions`),
  });
}

export function useCreateChatSession(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title: string) =>
      apiRequest<ChatSessionPublic>(`/projects/${projectId}/chat/sessions`, {
        method: "POST",
        body: { title },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions", projectId] });
    },
  });
}

export function useChatMessages(projectId: string, sessionId: string | null) {
  return useQuery({
    queryKey: ["chat-messages", projectId, sessionId],
    queryFn: () =>
      apiRequest<ChatMessagePublic[]>(`/projects/${projectId}/chat/sessions/${sessionId}/messages`),
    enabled: sessionId !== null,
  });
}

export function useSendChatMessage(projectId: string, sessionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      apiRequest<ChatMessagePublic[]>(
        `/projects/${projectId}/chat/sessions/${sessionId}/messages`,
        { method: "POST", body: { content } },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", projectId, sessionId] });
    },
  });
}
