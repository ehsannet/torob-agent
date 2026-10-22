"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  SellerAlternative,
  SellerCheckSummary,
  SellerCheckView,
} from "@/lib/seller-types";
import type { ProductGroup } from "@/lib/search-types";

const SESSION_KEY = "torob-seller-session";

function getSessionId(): string {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,80}$/.test(existing)) return existing;
    const id = `s-${crypto.randomUUID()}`;
    window.localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `s-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

type ViewMap = Record<string, SellerCheckView>;

export function useSellerChecks(group: ProductGroup) {
  const router = useRouter();
  const [sessionId] = useState(() =>
    typeof window === "undefined" ? "" : getSessionId(),
  );
  const [checks, setChecks] = useState<SellerCheckSummary[]>([]);
  const [views, setViews] = useState<ViewMap>({});
  const [selected, setSelected] = useState<string[]>(() =>
    group.offers[0] ? [group.offers[0].id] : [],
  );
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const viewsRef = useRef<ViewMap>({});
  const statusRef = useRef<Map<string, string>>(new Map());
  const offerIds = useMemo(
    () => group.offers.map((offer) => offer.id),
    [group.offers],
  );
  const visibleChecks = useMemo(
    () => checks.filter((check) => offerIds.includes(check.offerId)),
    [checks, offerIds],
  );
  const hasActive = visibleChecks.some(
    (check) => check.status === "sent" || check.status === "created",
  );
  const alternatives = useMemo(() => {
    const map = new Map<string, SellerAlternative>();
    for (const check of visibleChecks) {
      for (const alternative of views[check.token]?.alternatives ?? []) {
        map.set(alternative.offerId, alternative);
      }
    }
    return Array.from(map.values()).slice(0, 4);
  }, [visibleChecks, views]);

  const load = useCallback(async () => {
    if (!sessionId) return;
    try {
      const response = await fetch(
        `/api/seller-checks?sessionId=${encodeURIComponent(sessionId)}`,
        { cache: "no-store" },
      );
      if (!response.ok) return;
      const payload = (await response.json()) as { checks: SellerCheckSummary[] };
      const relevant = payload.checks.filter((check) =>
        offerIds.includes(check.offerId),
      );
      setChecks(relevant);
      for (const check of relevant) {
        if (!statusRef.current.has(check.token)) {
          statusRef.current.set(check.token, check.status);
        }
      }
      const needed = relevant.filter((check) => {
        const cached = viewsRef.current[check.token];
        return (
          check.status === "sent" ||
          check.status === "created" ||
          !cached ||
          cached.status !== check.status
        );
      });
      const loaded = await Promise.all(
        needed.map(async (check) => {
          const result = await fetch(`/api/seller-checks/${check.token}`, {
            cache: "no-store",
          });
          if (!result.ok) return null;
          const data = (await result.json()) as { check: SellerCheckView };
          return data.check;
        }),
      );
      let shouldRefresh = false;
      for (const view of loaded) {
        if (!view) continue;
        const previous = statusRef.current.get(view.token);
        if (
          (view.status === "answered" || view.status === "expired") &&
          (previous === "sent" || previous === "created")
        ) {
          shouldRefresh = true;
        }
        statusRef.current.set(view.token, view.status);
        viewsRef.current = { ...viewsRef.current, [view.token]: view };
      }
      if (loaded.some(Boolean)) setViews(viewsRef.current);
      if (shouldRefresh) router.refresh();
    } catch {
      return;
    }
  }, [sessionId, offerIds, router]);

  useEffect(() => {
    if (!sessionId) return;
    const initial = window.setTimeout(() => void load(), 0);
    const timer = hasActive
      ? window.setInterval(() => void load(), 3000)
      : null;
    return () => {
      window.clearTimeout(initial);
      if (timer !== null) window.clearInterval(timer);
    };
  }, [sessionId, load, hasActive]);

  const toggle = (offerId: string) => {
    setSelected((current) => {
      if (current.includes(offerId)) {
        return current.filter((id) => id !== offerId);
      }
      if (current.length >= 5) return current;
      return [...current, offerId];
    });
  };

  const create = async () => {
    if (selected.length === 0 || creating) {
      setError("حداقل یک فروشگاه را انتخاب کن.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const id = sessionId || getSessionId();
      const response = await fetch("/api/seller-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerIds: selected, sessionId: id }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { checks?: SellerCheckSummary[]; demoMode?: boolean; error?: string }
        | null;
      if (!response.ok || !payload?.checks) {
        throw new Error(payload?.error ?? "ساخت درخواست ممکن نشد.");
      }
      setChecks((current) => {
        const map = new Map(current.map((check) => [check.token, check]));
        for (const check of payload.checks ?? []) map.set(check.token, check);
        return Array.from(map.values());
      });
      setDemoMode(Boolean(payload.demoMode));
      for (const check of payload.checks) {
        statusRef.current.set(check.token, check.status);
      }
      setSelected([]);
      setOpen(false);
      void load();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "ساخت درخواست ممکن نشد.",
      );
    } finally {
      setCreating(false);
    }
  };

  return {
    visibleChecks,
    views,
    selected,
    open,
    setOpen,
    creating,
    error,
    demoMode,
    alternatives,
    toggle,
    create,
  };
}
