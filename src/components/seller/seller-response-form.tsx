"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatToman } from "@/lib/price";
import { toEnglishDigits } from "@/lib/persian";
import type { SellerQuestionView } from "@/lib/seller-types";
import { cn } from "@/lib/cn";
import { CheckIcon } from "@/components/ui/icons";

type Props = {
  token: string;
  questions: SellerQuestionView[];
  priceToman: number | null;
  simulated: boolean;
  onSubmitted?: () => void;
};

function parsePrice(value: string): number | null {
  const normalized = toEnglishDigits(value).replace(/[,\s٬،]/g, "");
  if (!normalized) return null;
  if (!/^\d+$/.test(normalized)) return Number.NaN;
  return Number(normalized);
}

export function SellerResponseForm({
  token,
  questions,
  priceToman,
  simulated,
  onSubmitted,
}: Props) {
  const router = useRouter();
  const [stockStatus, setStockStatus] = useState<
    "in_stock" | "out_of_stock" | null
  >(null);
  const [price, setPrice] = useState(priceToman ? String(priceToman) : "");
  const [hoursConfirmed, setHoursConfirmed] = useState(false);
  const [warrantyConfirmed, setWarrantyConfirmed] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const hasHours = questions.some((question) => question.key === "hours");
  const hasWarranty = questions.some((question) => question.key === "warranty");

  const submit = async () => {
    if (!stockStatus || busy) {
      setError("اول وضعیت موجودی را انتخاب کن.");
      return;
    }
    const confirmedPriceToman =
      stockStatus === "in_stock" ? parsePrice(price) : null;
    if (
      stockStatus === "in_stock" &&
      confirmedPriceToman !== null &&
      (!Number.isInteger(confirmedPriceToman) || confirmedPriceToman <= 0)
    ) {
      setError("قیمت را به تومان و بدون حروف وارد کن.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/seller-checks/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockStatus,
          confirmedPriceToman,
          hoursConfirmed: hasHours ? hoursConfirmed : undefined,
          warrantyConfirmed: hasWarranty ? warrantyConfirmed : undefined,
          note: note.trim() || null,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "ثبت پاسخ ممکن نشد.");
      }
      setDone(true);
      onSubmitted?.();
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "ثبت پاسخ ممکن نشد.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-success/20 bg-success/5 p-4 text-center">
        <span className="mx-auto grid size-10 place-items-center rounded-full bg-success/10 text-success">
          <CheckIcon className="size-5" />
        </span>
        <p className="mt-2 text-xs font-bold text-success">پاسخ ثبت شد</p>
        <p className="mt-1 text-[10px] leading-5 text-muted">
          قیمت و موجودی این آفر برای خریدار به‌روز می‌شود.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-4">
      <h2 className="text-sm font-extrabold">پاسخ یک‌لمسی به خریدار</h2>
      <p className="mt-1 text-[10px] leading-5 text-muted">
        {simulated
          ? "این درخواست در حالت دمو است؛ پاسخ خودکار هم پس از چند ثانیه ثبت می‌شود."
          : "پاسخ تو فقط برای به‌روزرسانی قیمت و موجودی همین آفر استفاده می‌شود."}
      </p>

      <p className="mt-3 text-[10px] font-bold">این محصول الآن موجود است؟</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setStockStatus("in_stock")}
          aria-pressed={stockStatus === "in_stock"}
          className={cn(
            "min-h-12 rounded-xl border px-3 py-3 text-xs font-bold transition",
            stockStatus === "in_stock"
              ? "border-success bg-success text-white"
              : "border-line bg-white text-ink hover:border-success/40",
          )}
        >
          موجود است
        </button>
        <button
          type="button"
          onClick={() => {
            setStockStatus("out_of_stock");
            setError(null);
          }}
          aria-pressed={stockStatus === "out_of_stock"}
          className={cn(
            "min-h-12 rounded-xl border px-3 py-3 text-xs font-bold transition",
            stockStatus === "out_of_stock"
              ? "border-danger bg-danger text-white"
              : "border-line bg-white text-ink hover:border-danger/40",
          )}
        >
          ناموجود است
        </button>
      </div>

      {stockStatus === "in_stock" ? (
        <label className="mt-3 block">
          <span className="text-[10px] font-bold">قیمت فعلی به تومان</span>
          <input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            inputMode="numeric"
            placeholder={priceToman ? String(priceToman) : "مثلاً 45000000"}
            className="mt-1 min-h-11 w-full rounded-xl border border-line bg-page/50 px-3 py-2 text-xs outline-none focus:border-brand-300"
          />
          <span className="mt-1 block text-[9px] text-muted">
            قیمت ثبت‌شده: {formatToman(priceToman)}؛ اگر تغییری نکرده، خالی هم می‌توانی بگذاری.
          </span>
        </label>
      ) : null}

      {hasHours ? (
        <label className="mt-3 flex items-start gap-2 rounded-xl border border-line p-3">
          <input
            type="checkbox"
            checked={hoursConfirmed}
            onChange={(event) => setHoursConfirmed(event.target.checked)}
            className="mt-0.5 size-4 accent-[var(--color-brand-500)]"
          />
          <span className="text-[10px] leading-5">
            ساعت کاری ثبت‌شده برای این فروشگاه درست است.
          </span>
        </label>
      ) : null}

      {hasWarranty ? (
        <label className="mt-2 flex items-start gap-2 rounded-xl border border-line p-3">
          <input
            type="checkbox"
            checked={warrantyConfirmed}
            onChange={(event) => setWarrantyConfirmed(event.target.checked)}
            className="mt-0.5 size-4 accent-[var(--color-brand-500)]"
          />
          <span className="text-[10px] leading-5">
            گارانتی ثبت‌شده برای این محصول معتبر است.
          </span>
        </label>
      ) : null}

      <label className="mt-3 block">
        <span className="text-[10px] font-bold">توضیح اختیاری</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          maxLength={300}
          placeholder="مثلاً رنگ یا مدل موجود"
          className="mt-1 w-full resize-none rounded-xl border border-line bg-page/50 px-3 py-2 text-xs leading-6 outline-none focus:border-brand-300"
        />
      </label>

      {error ? (
        <p className="mt-2 rounded-lg bg-danger/10 px-2.5 py-2 text-[10px] text-danger">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy || !stockStatus}
        className="mt-3 min-h-12 w-full rounded-xl bg-brand-500 px-4 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "در حال ثبت…" : "ثبت پاسخ"}
      </button>
    </section>
  );
}
