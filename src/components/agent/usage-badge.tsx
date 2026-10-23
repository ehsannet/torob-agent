import type { AgentUsageSnapshot } from "@/lib/agent-types";
import { formatPersianNumber, toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/cn";

export function UsageBadge({
  usage,
  className,
}: {
  usage: AgentUsageSnapshot | null;
  className?: string;
}) {
  if (!usage) {
    return (
      <span
        className={cn(
          "rounded-full border border-line bg-white/70 px-2.5 py-1 text-[11px] text-muted",
          className,
        )}
      >
        سهمیهٔ دستیار
      </span>
    );
  }

  const ratio = Math.min(
    1,
    usage.estimatedCostUsd / Math.max(usage.budgetUsd, 0.000001),
  );

  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-white/80 px-2.5 py-1.5",
        className,
      )}
      title={`${formatPersianNumber(usage.totalTokens)} توکن مصرف‌شده`}
    >
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-bold text-ink">
          ${toPersianDigits(usage.estimatedCostUsd.toFixed(4))}
        </span>
        <span className="text-muted">
          از ${toPersianDigits(usage.budgetUsd.toFixed(0))}
        </span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-page">
        <div
          className={cn(
            "h-full rounded-full",
            ratio > 0.85 ? "bg-danger" : "bg-brand-500",
          )}
          style={{ width: `${Math.max(2, ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}
