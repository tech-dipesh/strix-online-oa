"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { SeverityBadge } from "@/components/severity-badge";
import { useReviews } from "@/hooks/use-reviews";
import { useRequireAuth } from "@/hooks/use-require-auth";

const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "security", label: "Security" },
  { value: "performance", label: "Performance" },
  { value: "quality", label: "Code Quality" },
];

export default function ReviewHistoryPage() {
  const isReady = useRequireAuth();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [search, setSearch] = useState("");
  const [reviewType, setReviewType] = useState("");
  const { data: reviews, isLoading } = useReviews(projectId, { reviewType, search });

  if (!isReady) return null;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link
        href={`/projects/${projectId}`}
        className="mb-6 flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} /> Back to project
      </Link>

      <h1 className="mb-6 text-xl font-semibold text-foreground">Review history</h1>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by summary or file path"
            className="w-full rounded-md border border-border bg-surface px-9 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>
        <div className="flex gap-2">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setReviewType(filter.value)}
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${
                reviewType === filter.value
                  ? "border-accent text-accent"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted">Loading reviews...</p>}

      {!isLoading && reviews?.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
          No reviews yet.
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {reviews?.map((review) => {
          const worstSeverity = review.issues[0]?.severity;
          return (
            <li key={review.id}>
              <Link
                href={`/projects/${projectId}/reviews/${review.id}`}
                className="flex flex-col gap-2 rounded-lg border border-border bg-surface/40 p-4 hover:border-accent/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-accent">
                    {review.review_type}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(review.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-foreground">{review.summary}</p>
                <div className="flex items-center gap-2">
                  {worstSeverity && <SeverityBadge severity={worstSeverity} />}
                  <span className="text-xs text-muted">
                    {review.issues.length} issue{review.issues.length === 1 ? "" : "s"} ·{" "}
                    {review.reviewed_paths.length} file{review.reviewed_paths.length === 1 ? "" : "s"}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
