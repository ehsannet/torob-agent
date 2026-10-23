import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PageStatusProps = {
  eyebrow?: string;
  title: string;
  description: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageStatus({
  eyebrow,
  title,
  description,
  icon,
  actions,
  className,
}: PageStatusProps) {
  return (
    <main
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-4 px-6 text-center",
        className,
      )}
    >
      <section className="w-full rounded-card border border-line bg-surface p-6 shadow-card">
        {icon ? (
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            {icon}
          </span>
        ) : null}
        {eyebrow ? (
          <p className="mt-3 text-[12px] font-bold text-brand-600">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-lg font-black leading-8">{title}</h1>
        <p className="mt-2 text-[13px] leading-7 text-muted">{description}</p>
        {actions ? (
          <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>
        ) : null}
      </section>
    </main>
  );
}
