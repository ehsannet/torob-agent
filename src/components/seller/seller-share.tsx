"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SellerCheckStatus } from "@/lib/seller-types";
import { CheckIcon, SparkIcon } from "@/components/ui/icons";

export function SellerShare({
  linkPath,
  status,
}: {
  linkPath: string;
  status: SellerCheckStatus;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCanShare(typeof navigator !== "undefined" && "share" in navigator);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (status !== "sent" && status !== "created") return;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(
          `/api/seller-checks/${encodeURIComponent(linkPath.split("/").pop() ?? "")}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const payload = (await response.json()) as {
          check?: { status?: SellerCheckStatus };
        };
        if (payload.check?.status && payload.check.status !== status) {
          router.refresh();
        }
      } catch {
        return;
      }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [linkPath, router, status]);

  const copy = async () => {
    const url = `${window.location.origin}${linkPath}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const share = async () => {
    const url = `${window.location.origin}${linkPath}`;
    try {
      await navigator.share({ title: "تأیید قیمت و موجودی", url });
    } catch {
      return;
    }
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => void copy()}
        className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-line bg-white px-3 text-[10px] font-bold text-muted"
      >
        {copied ? <CheckIcon className="size-3.5 text-success" /> : null}
        {copied ? "کپی شد" : "کپی لینک"}
      </button>
      {canShare ? (
        <button
          type="button"
          onClick={() => void share()}
          className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-ink px-3 text-[10px] font-bold text-white"
        >
          <SparkIcon className="size-3.5" />
          ارسال لینک
        </button>
      ) : null}
    </div>
  );
}
