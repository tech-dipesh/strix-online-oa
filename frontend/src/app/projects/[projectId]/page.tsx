"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, GitCompare, History, MessageSquare } from "lucide-react";
import { FileTree } from "@/components/file-tree";
import { RunReviewPanel } from "@/components/run-review-panel";
import { UploadDropzone } from "@/components/upload-dropzone";
import { useFileContent, useFiles } from "@/hooks/use-files";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { buildFileTree } from "@/lib/file-tree";

export default function ProjectDetailPage() {
  const isReady = useRequireAuth();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const { data: files, isLoading } = useFiles(projectId);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const { data: fileContent, isLoading: isContentLoading } = useFileContent(
    projectId,
    selectedFileId,
  );

  if (!isReady) return null;

  const tree = buildFileTree(files ?? []);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/projects" className="flex items-center gap-2 text-sm text-muted hover:text-foreground">
          <ArrowLeft size={16} /> Back to projects
        </Link>
        <div className="flex gap-4">
          <Link
            href={`/projects/${projectId}/chat`}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground"
          >
            <MessageSquare size={16} /> Chat with code
          </Link>
          <Link
            href={`/projects/${projectId}/diff`}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground"
          >
            <GitCompare size={16} /> Diff review
          </Link>
          <Link
            href={`/projects/${projectId}/docs`}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground"
          >
            <FileText size={16} /> Docs
          </Link>
          <Link
            href={`/projects/${projectId}/reviews`}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground"
          >
            <History size={16} /> Review history
          </Link>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted">Loading files...</p>}

      {!isLoading && files?.length === 0 && (
        <div className="mb-6">
          <UploadDropzone projectId={projectId} />
        </div>
      )}

      {!isLoading && files && files.length > 0 && (
        <div className="grid grid-cols-[260px_1fr] gap-6">
          <aside className="flex flex-col gap-4">
            <UploadDropzone projectId={projectId} />
            <div className="rounded-lg border border-border bg-surface/30 p-2">
              <FileTree
                nodes={tree}
                selectedFileId={selectedFileId}
                onSelectFile={setSelectedFileId}
              />
            </div>
            <RunReviewPanel projectId={projectId} selectedFileId={selectedFileId} />
          </aside>

          <section className="rounded-lg border border-border bg-surface/30 p-4">
            {!selectedFileId && (
              <p className="text-sm text-muted">Select a file to preview it.</p>
            )}
            {selectedFileId && isContentLoading && (
              <p className="text-sm text-muted">Loading file...</p>
            )}
            {selectedFileId && fileContent && (
              <div>
                <p className="mb-3 border-b border-border pb-2 text-xs text-muted">
                  {fileContent.path}
                </p>
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-foreground">
                  {fileContent.content}
                </pre>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
