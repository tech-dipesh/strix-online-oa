"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SeverityBadge } from "@/components/severity-badge";
import { useReview } from "@/hooks/use-reviews";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function ReviewDetailPage() {
  const isReady = useRequireAuth();
  const params = useParams<{ projectId: string; reviewId: string }>();
  const { data: review, isLoading } = useReview(params.projectId, params.reviewId);

  if (!isReady) return null;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link
        href={`/projects/${params.projectId}/reviews`}
        className="mb-6 flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} /> Back to review history
      </Link>

      {isLoading && <p className="text-sm text-muted">Loading review...</p>}

      {review && (
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-xs uppercase tracking-wide text-accent">
              {review.review_type} review
            </span>
            <h1 className="mt-1 text-lg font-semibold text-foreground">{review.summary}</h1>
            <p className="mt-1 text-xs text-muted">
              {new Date(review.created_at).toLocaleString()} ·{" "}
              {review.reviewed_paths.length} file{review.reviewed_paths.length === 1 ? "" : "s"}{" "}
              reviewed
            </p>
          </div>

          <section>
            <h2 className="mb-3 text-sm font-medium text-foreground">
              Issues ({review.issues.length})
            </h2>
            {review.issues.length === 0 && (
              <p className="text-sm text-muted">No issues found.</p>
            )}
            <div className="flex flex-col gap-3">
              {review.issues.map((issue, index) => (
                <div key={index} className="rounded-lg border border-border bg-surface/30 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{issue.title}</p>
                    <SeverityBadge severity={issue.severity} />
                  </div>
                  <p className="mb-2 text-sm text-muted">{issue.description}</p>
                  <p className="font-mono text-xs text-accent">
                    {issue.file_path}
                    {issue.line !== null ? `:${issue.line}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-foreground">Recommendations</h2>
            {review.recommendations.length === 0 ? (
              <p className="text-sm text-muted">No recommendations.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {review.recommendations.map((rec, index) => (
                  <li
                    key={index}
                    className="rounded-lg border border-border bg-surface/30 p-3 text-sm text-foreground"
                  >
                    {rec}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
