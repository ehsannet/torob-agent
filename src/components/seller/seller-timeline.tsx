import { formatAbsoluteDate, formatRelativeTime } from "@/lib/price";
import type { SellerTimelineStep } from "@/lib/seller-types";
import { cn } from "@/lib/cn";

const STATE_CLASSES: Record<SellerTimelineStep["state"], string> = {
  done: "bg-success",
  active: "bg-brand-500",
  failed: "bg-danger",
  pending: "bg-line",
};

export function SellerTimeline({
  steps,
  compact = false,
}: {
  steps: SellerTimelineStep[];
  compact?: boolean;
}) {
  return (
    <ol className={cn("space-y-2", compact && "space-y-1.5")} aria-label="روند درخواست">
      {steps.map((step) => (
        <li key={step.key} className="flex items-start gap-2">
          <span
            aria-hidden="true"
            className={cn(
              "mt-1.5 size-2 shrink-0 rounded-full",
              STATE_CLASSES[step.state],
            )}
          />
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-[10px] font-semibold",
                step.state === "pending" ? "text-muted" : "text-ink",
                compact && "text-[9px]",
              )}
            >
              {step.label}
            </p>
            {step.at && (step.state === "done" || step.state === "failed") ? (
              <p
                className="mt-0.5 text-[9px] text-muted"
                title={formatAbsoluteDate(step.at)}
              >
                {formatRelativeTime(step.at)}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
