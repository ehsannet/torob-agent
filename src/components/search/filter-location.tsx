"use client";

import { formatNumber } from "@/lib/price";
import { PinIcon } from "@/components/ui/icons";

type LocationFieldProps = {
  lat: number | null;
  radiusKm: number;
  busy: boolean;
  message: string | null;
  onLocate: () => void;
  onClear: () => void;
  onRadiusChange: (radiusKm: number) => void;
};

export function LocationField({
  lat,
  radiusKm,
  busy,
  message,
  onLocate,
  onClear,
  onRadiusChange,
}: LocationFieldProps) {
  return (
    <div className="rounded-2xl border border-line bg-page/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1 text-xs font-bold">
            <PinIcon className="size-3.5 text-brand-600" />
            جست‌وجو نزدیک من
          </p>
          <p className="mt-1 text-[10px] leading-5 text-muted">
            {lat !== null
              ? `موقعیت فعلی ثبت شد · شعاع ${formatNumber(radiusKm)} کیلومتر`
              : "با اجازهٔ موقعیت، فروشگاه‌های اطراف را اول می‌بینی."}
          </p>
        </div>
        {lat !== null ? (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 text-[10px] font-semibold text-danger"
          >
            حذف
          </button>
        ) : null}
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onLocate}
          disabled={busy}
          className="rounded-xl bg-ink px-3 py-2 text-[10px] font-bold text-white disabled:opacity-50"
        >
          {busy ? "در حال دریافت…" : "موقعیت من"}
        </button>
        {lat !== null ? (
          <select
            value={radiusKm}
            onChange={(event) => onRadiusChange(Number(event.target.value))}
            className="rounded-xl border border-line bg-white px-2 py-2 text-[10px]"
          >
            {[1, 2, 3, 5, 10].map((radius) => (
              <option key={radius} value={radius}>
                {formatNumber(radius)} کیلومتر
              </option>
            ))}
          </select>
        ) : null}
      </div>
      {message ? (
        <p className="mt-2 text-[10px] text-warning">{message}</p>
      ) : null}
    </div>
  );
}
