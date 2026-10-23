import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/ui/brand-header";
import { SellerResponseForm } from "@/components/seller/seller-response-form";
import { SellerTimeline } from "@/components/seller/seller-timeline";
import { formatRelativeTime, formatToman } from "@/lib/price";
import {
  SELLER_STATUS_CLASSES,
  SELLER_STATUS_LABELS,
} from "@/lib/seller-labels";
import { isDemoMode } from "@/server/seller/channel";
import { listDemoChecks } from "@/server/seller/demo";
import { isSellerToken } from "@/server/seller/tokens";
import { getSellerCheckView } from "@/server/seller/view";
import { markSellerCheckSeen } from "@/server/seller/seen";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "شبیه‌ساز فروشنده | ترب‌یار",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function SellerSimulatorPage({
  searchParams,
}: PageProps) {
  if (!isDemoMode()) notFound();
  const params = await searchParams;
  const tokenValue = Array.isArray(params.token)
    ? params.token[0]
    : params.token;
  if (tokenValue && isSellerToken(tokenValue)) {
    await markSellerCheckSeen(tokenValue).catch(() => undefined);
  }
  const [checks, view] = await Promise.all([
    listDemoChecks().catch(() => []),
    tokenValue && isSellerToken(tokenValue)
      ? getSellerCheckView(tokenValue).catch(() => null)
      : Promise.resolve(null),
  ]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pb-10 pt-5">
      <BrandHeader backHref="/search" backLabel="بازگشت" />

      <section className="rounded-card border border-brand-100 bg-brand-50/60 p-4">
        <h1 className="text-base font-black">شبیه‌ساز فروشنده</h1>
        <p className="mt-1 text-[12px] leading-5 text-muted">
          این صفحه فقط در حالت دمو فعال است. یکی از درخواست‌های شبیه‌سازی‌شده را
          انتخاب کن و به‌جای فروشنده پاسخ بده.
        </p>
      </section>

      {view ? (
        <section className="space-y-3">
          <div className="rounded-card border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[12px] font-bold">{view.shop.name}</p>
                <p className="mt-1 text-[12px] text-muted">
                  {view.product.titleFa} · {formatToman(view.offer.priceToman)}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-bold",
                  SELLER_STATUS_CLASSES[view.status],
                )}
              >
                {SELLER_STATUS_LABELS[view.status]}
              </span>
            </div>
            <div className="mt-3">
              <SellerTimeline steps={view.timeline} />
            </div>
            <Link
              href={`/s/${view.token}`}
              className="mt-3 block text-[12px] font-bold text-brand-700"
            >
              باز کردن صفحهٔ خریدار
            </Link>
          </div>
          {view.status === "sent" || view.status === "created" ? (
            <SellerResponseForm
              token={view.token}
              questions={view.questions}
              priceToman={view.offer.priceToman}
              simulated
            />
          ) : (
            <p className="rounded-xl bg-page p-3 text-[12px] leading-5 text-muted">
              این درخواست بسته شده است. برای تست دوباره از نتایج جست‌وجو درخواست
              تازه بساز.
            </p>
          )}
        </section>
      ) : (
        <p className="rounded-xl border border-line bg-surface p-3 text-[12px] text-muted">
          یک درخواست را از فهرست پایین انتخاب کن.
        </p>
      )}

      <section className="rounded-card border border-line bg-surface p-3">
        <h2 className="text-sm font-extrabold">درخواست‌های دمو</h2>
        {checks.length === 0 ? (
          <p className="mt-2 text-[12px] leading-5 text-muted">
            هنوز درخواستی ساخته نشده است. از نتایج جست‌وجو، «از فروشنده بپرس» را
            بزن.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {checks.map((check) => (
              <li key={check.token}>
                <Link
                  href={`/dev/seller-simulator?token=${check.token}`}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl border p-2.5",
                    view?.token === check.token
                      ? "border-brand-300 bg-brand-50/50"
                      : "border-line bg-white",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-bold">
                      {check.shop_name}
                    </span>
                    <span className="block truncate text-[11px] text-muted">
                      {check.product_title} · {formatRelativeTime(check.created_at)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                      SELLER_STATUS_CLASSES[check.status],
                    )}
                  >
                    {SELLER_STATUS_LABELS[check.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-[11px] leading-5 text-muted">
        پاسخ خودکار دمو پس از ۶ تا ۱۲ ثانیه و هنگام درخواست وضعیت ثبت می‌شود.
      </p>
    </main>
  );
}
