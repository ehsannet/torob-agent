import Link from "next/link";
import { BrandHeader } from "@/components/ui/brand-header";
import { SearchForm } from "@/components/search/search-form";
import { HealthStatus } from "@/components/health-status";
import {
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  PinIcon,
  ScaleIcon,
  ShieldIcon,
  SparkIcon,
  StoreIcon,
} from "@/components/ui/icons";
import { CATEGORY_ACCENTS, categoryInitial } from "@/lib/ui-labels";
import { cn } from "@/lib/cn";

const categories = [
  { label: "گوشی موبایل", hint: "اپل، سامسونگ و شیائومی" },
  { label: "لپ تاپ و نوت بوک", hint: "اداری و گیمینگ" },
  { label: "هدفون، هدست و هندزفری", hint: "بی‌سیم و سیمی" },
  { label: "ساعت و مچ بند هوشمند", hint: "اسپرت و روزمره" },
  { label: "کنسول بازی  PS5", hint: "خانگی و دستی" },
  { label: "تلویزیون", hint: "هوشمند و ۴K" },
  { label: "دوربین عکاسی و فیلمبرداری", hint: "حرفه‌ای و خانگی" },
  { label: "دوربین مدار بسته", hint: "امنیت و نظارت" },
];

const quickSearches = ["iPhone 15", "گوشی سامسونگ", "هدفون", "لپ‌تاپ"];

const trustItems = [
  {
    icon: StoreIcon,
    title: "قیمت ثبت‌شده",
    text: "قیمت هر فروشگاه جدا نشان داده می‌شود.",
  },
  {
    icon: ClockIcon,
    title: "آخرین تغییر",
    text: "قدمت قیمت مشخص است و قیمت کهنه هشدار دارد.",
  },
  {
    icon: ShieldIcon,
    title: "موجودی تأییدشده",
    text: "تا تأیید فروشنده، «نامشخص» است.",
  },
];

const steps = [
  { title: "جست‌وجو یا دسته", text: "محصول را با نام یا دسته پیدا کن." },
  { title: "فیلتر محله", text: "بودجه، محله، باز بودن و شرایط خرید." },
  { title: "مقایسه", text: "دو تا چهار محصول را کنار هم ببین و دلیل را بخوان." },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pb-10 pt-5">
      <BrandHeader />

      <section className="relative overflow-hidden rounded-card border border-line bg-surface p-5 shadow-sm">
        <div
          aria-hidden="true"
          className="absolute -left-12 -top-16 size-40 rounded-full bg-brand-100/60 blur-3xl"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-bold text-brand-700">
            <SparkIcon className="size-3" />
            دادهٔ واقعی ترب: ۶٬۴۷۶ فروشگاه
          </span>
          <h1 className="mt-3 text-2xl font-black leading-[1.55]">
            قبل از رفتن،
            <span className="text-brand-600"> فروشگاه درست</span> را پیدا کن.
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            قیمت‌های اطراف را ببین، ساعت کاری و فاصله را مقایسه کن و بدان چه
            چیزی تأیید شده و چه چیزی هنوز نامشخص است.
          </p>

          <div className="mt-4">
            <SearchForm />
          </div>

          <Link
            href="/assistant"
            className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-brand-200 bg-brand-50/70 px-3 py-2.5 transition hover:border-brand-500"
          >
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-brand-700">
              <SparkIcon className="size-3.5" />
              نمی‌دانی چه بنویسی؟ از دستیار خرید بپرس
            </span>
            <ChevronLeftIcon className="size-3.5 text-brand-600" />
          </Link>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {quickSearches.map((query) => (
              <Link
                key={query}
                href={`/search?q=${encodeURIComponent(query)}`}
                className="rounded-full border border-line bg-page px-2.5 py-1 text-[12px] font-medium text-muted transition hover:border-brand-200 hover:text-brand-700"
              >
                {query}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="شفافیت داده" className="rounded-card border border-line bg-surface px-3 py-2">
        <div className="divide-y divide-line">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-2.5 py-2 first:pt-0 last:pb-0">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-extrabold">{item.title}</p>
                  <p className="mt-0.5 text-[11px] leading-5 text-muted">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="categories-title">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 id="categories-title" className="text-base font-bold">
            دسته‌های پرطرفدار
          </h2>
          <Link
            href="/search"
            className="text-[12px] font-semibold text-brand-700"
          >
            همهٔ محصولات
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((category) => (
            <Link
              key={category.label}
              href={`/search?category=${encodeURIComponent(category.label)}`}
              className="group flex items-center gap-2.5 rounded-2xl border border-line bg-surface p-2.5 transition hover:border-brand-200"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-base font-black",
                  CATEGORY_ACCENTS[category.label] ??
                    "from-brand-100 to-brand-50 text-brand-700",
                )}
              >
                {categoryInitial(category.label)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-[13px] font-bold leading-5">
                  {category.label}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted">
                  {category.hint}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-4">
        <div className="flex items-center gap-2">
          <ScaleIcon className="size-4 text-brand-600" />
          <h2 className="text-base font-bold">مسیر تا تصمیم</h2>
        </div>
        <ol className="mt-3 space-y-2.5">
          {steps.map((step, index) => (
            <li key={step.title} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">
                {new Intl.NumberFormat("fa-IR").format(index + 1)}
              </span>
              <div>
                <p className="text-[13px] font-bold">{step.title}</p>
                <p className="mt-0.5 text-[12px] leading-5 text-muted">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-card border border-warning/20 bg-warning/5 p-3.5">
        <p className="flex items-center gap-1.5 text-[13px] font-bold text-warning">
          <PinIcon className="size-3.5" />
          دادهٔ واقعی ترب در حال استفاده است
        </p>
        <p className="mt-1.5 text-[12px] leading-6 text-muted">
          ۶٬۴۷۶ فروشگاه، ۲۲۵٬۹۰۳ محصول و ۳۳۱٬۵۰۶ آفر. قیمت‌های ثبت‌شده ممکن
          است قدیمی باشند؛ ۱۵٬۵۹۱ آفر قیمت ندارد و تا تأیید فروشنده قابل اتکا
          نیستند.
        </p>
      </section>

      <HealthStatus />

      <footer className="mt-auto text-center text-[12px] leading-6 text-muted">
        <p className="flex items-center justify-center gap-1">
          <CheckIcon className="size-3 text-success" />
          جست‌وجو و مقایسه بدون نیاز به LLM کار می‌کنند؛ دستیار در صورت خطا به جست‌وجوی مستقیم برمی‌گردد.
        </p>
        <Link
          href="/api/health"
          className="font-medium text-brand-700 underline underline-offset-4"
        >
          مشاهدهٔ وضعیت خام سرویس
        </Link>
      </footer>
    </main>
  );
}
