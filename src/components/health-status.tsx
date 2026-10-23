"use client";

import { useEffect, useState } from "react";

type DbStatus = "up" | "down" | "not_configured";

type HealthPayload = {
  status: "ok" | "degraded";
  phase: number;
  db: {
    status: DbStatus;
    latencyMs?: number;
  };
  timestamp: string;
  responseTimeMs: number;
};

type ViewState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ok"; data: HealthPayload };

const faNumber = new Intl.NumberFormat("fa-IR");
const faDateTime = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Tehran",
});

const dbLabels: Record<DbStatus, string> = {
  up: "متصل",
  down: "قطع",
  not_configured: "تنظیم‌نشده",
};

const dbTones: Record<DbStatus, string> = {
  up: "bg-success",
  down: "bg-danger",
  not_configured: "bg-warning",
};

export function HealthStatus() {
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetch("/api/health", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`health responded with ${response.status}`);
        }
        return (await response.json()) as HealthPayload;
      })
      .then((data) => {
        if (active) setState({ kind: "ok", data });
      })
      .catch(() => {
        if (active) setState({ kind: "error" });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  return (
    <section
      aria-labelledby="status-title"
      className="rounded-card border border-line bg-surface p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="status-title" className="text-base font-bold">
          وضعیت سامانه
        </h2>
        <span className="text-[13px] text-muted">بررسی زنده</span>
      </div>

      <div role="status" aria-live="polite">
        {state.kind === "loading" && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="size-2 animate-pulse rounded-full bg-brand-500" />
            در حال بررسی وضعیت سرور…
          </div>
        )}

        {state.kind === "error" && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-danger">دریافت وضعیت سرور ممکن نشد.</p>
            <button
              type="button"
              onClick={() => {
                setState({ kind: "loading" });
                setAttempt((value) => value + 1);
              }}
              className="rounded-full border border-line px-3 py-1.5 text-sm font-medium"
            >
              تلاش دوباره
            </button>
          </div>
        )}

        {state.kind === "ok" && (
          <div className="flex flex-col gap-2.5">
            <dl className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-page p-3">
                <dt className="text-[13px] text-muted">سرور</dt>
                <dd className="mt-1 flex items-center gap-1.5 text-sm font-bold">
                  <span className="size-2 rounded-full bg-success" />
                  فعال
                </dd>
              </div>
              <div className="rounded-xl bg-page p-3">
                <dt className="text-[13px] text-muted">دیتابیس</dt>
                <dd className="mt-1 flex items-center gap-1.5 text-sm font-bold">
                  <span
                    className={`size-2 rounded-full ${dbTones[state.data.db.status]}`}
                  />
                  {dbLabels[state.data.db.status]}
                  {typeof state.data.db.latencyMs === "number" && (
                    <span className="font-normal text-muted">
                      ({faNumber.format(state.data.db.latencyMs)}ms)
                    </span>
                  )}
                </dd>
              </div>
            </dl>
            <p className="text-[13px] leading-5 text-muted">
              آخرین بررسی: {faDateTime.format(new Date(state.data.timestamp))}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
