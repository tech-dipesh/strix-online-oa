"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/severity-badge";
import { useFiles } from "@/hooks/use-files";
import { useCreateDiffReview } from "@/hooks/use-diff-review";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { ApiError } from "@/lib/api";

export default function DiffReviewPage() {
  const isReady = useRequireAuth();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const { data: files } = useFiles(projectId);
  const createDiffReview = useCreateDiffReview(projectId);

  const [fileIdA, setFileIdA] = useState("");
  const [fileIdB, setFileIdB] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isReady) return null;

  const result = createDiffReview.data;

  const handleCompare = () => {
    if (!fileIdA || !fileIdB) return;
    setError(null);
    createDiffReview.mutate(
      { file_id_a: fileIdA, file_id_b: fileIdB },
      {
        onError: (err) => setError(err instanceof ApiError ? err.message : "Comparison failed"),
      },
    );
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link
        href={`/projects/${projectId}`}
        className="mb-6 flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} /> Back to project
      </Link>

      <h1 className="mb-1 text-xl font-semibold text-foreground">Diff review</h1>
      <p className="mb-6 text-sm text-muted">Compare two files and get an AI risk assessment.</p>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <select
          value={fileIdA}
          onChange={(e) => setFileIdA(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        >
          <option value="">Select file A</option>
          {files?.map((f) => (
            <option key={f.id} value={f.id}>
              {f.path}
            </option>
          ))}
        </select>
        <select
          value={fileIdB}
          onChange={(e) => setFileIdB(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        >
          <option value="">Select file B</option>
          {files?.map((f) => (
            <option key={f.id} value={f.id}>
              {f.path}
            </option>
          ))}
        </select>
      </div>

      <Button
        onClick={handleCompare}
        disabled={!fileIdA || !fileIdB || createDiffReview.isPending}
      >
        <span className="flex items-center gap-2">
          <GitCompare size={16} />
          {createDiffReview.isPending ? "Comparing..." : "Compare"}
        </span>
      </Button>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-8 flex flex-col gap-6">
          <div>
            <p className="mb-2 text-xs text-muted">
              {result.file_path_a} → {result.file_path_b}
            </p>
            <p className="text-sm text-foreground">{result.summary}</p>
          </div>

          <pre className="overflow-x-auto rounded-lg border border-border bg-surface/40 p-4 text-xs text-foreground">
            {result.diff_text}
          </pre>

          {result.issues.length > 0 && (
            <div className="flex flex-col gap-3">
              {result.issues.map((issue, index) => (
                <div key={index} className="rounded-lg border border-border bg-surface/30 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{issue.title}</p>
                    <SeverityBadge severity={issue.severity} />
                  </div>
                  <p className="text-sm text-muted">{issue.description}</p>
                </div>
              ))}
            </div>
          )}

          {result.recommendations.length > 0 && (
            <ul className="flex flex-col gap-2">
              {result.recommendations.map((rec, index) => (
                <li
                  key={index}
                  className="rounded-lg border border-border bg-surface/30 p-3 text-sm text-foreground"
                >
                  {rec}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
