import type { Severity } from "@/lib/types";

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${SEVERITY_STYLES[severity]}`}
    >
      {severity}
    </span>
  );
}
