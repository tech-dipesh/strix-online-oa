"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Copy, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGenerateDoc, useGeneratedDocs } from "@/hooks/use-docs";
import { useRequireAuth } from "@/hooks/use-require-auth";
import type { DocType } from "@/lib/types";
import { ApiError } from "@/lib/api";

const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: "readme", label: "README" },
  { value: "setup", label: "Setup Guide" },
  { value: "api", label: "API Documentation" },
];

export default function DocsPage() {
  const isReady = useRequireAuth();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const { data: docs } = useGeneratedDocs(projectId);
  const generateDoc = useGenerateDoc(projectId);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isReady) return null;

  const latestDoc = generateDoc.data ?? docs?.[0] ?? null;

  const handleGenerate = (docType: DocType) => {
    setError(null);
    generateDoc.mutate(docType, {
      onError: (err) => setError(err instanceof ApiError ? err.message : "Generation failed"),
    });
  };

  const handleCopy = () => {
    if (!latestDoc) return;
    navigator.clipboard.writeText(latestDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link
        href={`/projects/${projectId}`}
        className="mb-6 flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} /> Back to project
      </Link>

      <h1 className="mb-1 text-xl font-semibold text-foreground">Documentation generator</h1>
      <p className="mb-6 text-sm text-muted">Generate docs for this project from its source files.</p>

      <div className="mb-6 flex gap-2">
        {DOC_TYPES.map((doc) => (
          <Button
            key={doc.value}
            variant="ghost"
            disabled={generateDoc.isPending}
            onClick={() => handleGenerate(doc.value)}
          >
            <span className="flex items-center gap-2">
              <FileText size={16} />
              {generateDoc.isPending ? "Generating..." : doc.label}
            </span>
          </Button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {latestDoc && (
        <div className="rounded-lg border border-border bg-surface/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-accent">
              {latestDoc.doc_type}
            </span>
            <button
              onClick={handleCopy}
              className="flex cursor-pointer items-center gap-1.5 text-xs text-muted hover:text-foreground"
            >
              <Copy size={13} /> {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-foreground">
            {latestDoc.content}
          </pre>
        </div>
      )}
    </main>
  );
}
