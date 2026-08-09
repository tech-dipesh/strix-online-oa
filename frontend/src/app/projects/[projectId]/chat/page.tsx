"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState , SubmitEvent} from "react";
import { ArrowLeft, MessageSquarePlus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useChatMessages,
  useChatSessions,
  useCreateChatSession,
  useSendChatMessage,
} from "@/hooks/use-chat";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { ApiError } from "@/lib/api";

export default function ChatPage() {
  const isReady = useRequireAuth();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const { data: sessions, isLoading: isLoadingSessions } = useChatSessions(projectId);
  const createSession = useCreateChatSession(projectId);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const currentSessionId = activeSessionId ?? sessions?.[0]?.id ?? null;

  const { data: messages, isLoading: isLoadingMessages } = useChatMessages(
    projectId,
    currentSessionId,
  );
  const sendMessage = useSendChatMessage(projectId, currentSessionId);

  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isReady) return null;

  const handleNewSession = () => {
    createSession.mutate(`Chat ${(sessions?.length ?? 0) + 1}`, {
      onSuccess: (session) => setActiveSessionId(session.id),
    });
  };

  const handleSend = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || !currentSessionId) return;

    setError(null);
    const content = input;
    setInput("");
    sendMessage.mutate(content, {
      onError: (err) => {
        setError(err instanceof ApiError ? err.message : "Message failed to send");
        setInput(content);
      },
    });
  };

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <Link
        href={`/projects/${projectId}`}
        className="mb-6 flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} /> Back to project
      </Link>

      <div className="grid grid-cols-[200px_1fr] gap-6">
        <aside className="flex flex-col gap-2">
          <Button variant="ghost" onClick={handleNewSession} disabled={createSession.isPending}>
            <span className="flex items-center gap-2">
              <MessageSquarePlus size={16} /> New chat
            </span>
          </Button>

          {isLoadingSessions && <p className="text-xs text-muted">Loading...</p>}

          <ul className="flex flex-col gap-1">
            {sessions?.map((session) => (
              <li key={session.id}>
                <button
                  onClick={() => setActiveSessionId(session.id)}
                  className={`w-full cursor-pointer truncate rounded-md px-3 py-2 text-left text-sm ${
                    session.id === currentSessionId
                      ? "bg-surface text-accent"
                      : "text-muted hover:bg-surface"
                  }`}
                >
                  {session.title}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex h-[70vh] flex-col rounded-lg border border-border bg-surface/30">
          {!currentSessionId && (
            <div className="flex flex-1 items-center justify-center text-sm text-muted">
              Start a new chat to ask about this codebase.
            </div>
          )}

          {currentSessionId && (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                {isLoadingMessages && <p className="text-sm text-muted">Loading messages...</p>}

                {!isLoadingMessages && messages?.length === 0 && (
                  <p className="text-sm text-muted">
                    Ask something like &quot;Explain how authentication works&quot; or &quot;Which
                    file handles database connections?&quot;
                  </p>
                )}

                <div className="flex flex-col gap-4">
                  {messages?.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                        message.role === "user"
                          ? "ml-auto bg-accent text-slate-900"
                          : "bg-surface text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.referenced_paths.length > 0 && (
                        <p className="mt-2 text-xs opacity-70">
                          Referenced: {message.referenced_paths.join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                  {sendMessage.isPending && (
                    <p className="text-sm text-muted">Thinking...</p>
                  )}
                </div>
              </div>

              {error && <p className="px-4 pb-2 text-xs text-red-400">{error}</p>}

              <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your code..."
                  className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                />
                <Button type="submit" disabled={sendMessage.isPending || !input.trim()}>
                  <Send size={16} />
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
