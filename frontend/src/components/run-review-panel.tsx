"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateReview } from "@/hooks/use-reviews";
import type { ReviewType } from "@/lib/types";
import { ApiError } from "@/lib/api";

const REVIEW_TYPES: { value: ReviewType; label: string }[] = [
  { value: "security", label: "Security" },
  { value: "performance", label: "Performance" },
  { value: "quality", label: "Code Quality" },
];

export function RunReviewPanel({
  projectId,
  selectedFileId,
}: {
  projectId: string;
  selectedFileId: string | null;
}) {
  const router = useRouter();
  const createReview = useCreateReview(projectId);
  const [reviewType, setReviewType] = useState<ReviewType>("security");
  const [error, setError] = useState<string | null>(null);

  const runReview = (fileIds: string[] | null) => {
    setError(null);
    createReview.mutate(
      { review_type: reviewType, file_ids: fileIds },
      {
        onSuccess: (review) => router.push(`/projects/${projectId}/reviews/${review.id}`),
        onError: (err) => {
          setError(err instanceof ApiError ? err.message : "Review failed");
        },
      },
    );
  };

  return (
    <div className="rounded-lg border border-border bg-surface/30 p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <Sparkles size={16} className="text-accent" /> Run a review
      </p>

      <div className="mb-3 flex gap-2">
        {REVIEW_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setReviewType(type.value)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${
              reviewType === type.value
                ? "border-accent text-accent"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

      <div className="flex flex-col gap-2">
        <Button
          variant="ghost"
          disabled={!selectedFileId || createReview.isPending}
          onClick={() => selectedFileId && runReview([selectedFileId])}
        >
          {createReview.isPending ? "Running..." : "Review selected file"}
        </Button>
        <Button disabled={createReview.isPending} onClick={() => runReview(null)}>
          {createReview.isPending ? "Running..." : "Review entire project"}
        </Button>
      </div>
    </div>
  );
}
