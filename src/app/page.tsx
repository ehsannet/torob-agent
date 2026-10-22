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
  { label: "موبایل", hint: "گوشی و لوازم" },
  { label: "لپ‌تاپ", hint: "اداری و گیمینگ" },
  { label: "هدفون و هندزفری", hint: "بی‌سیم و سیمی" },
  { label: "ساعت هوشمند", hint: "اسپرت و روزمره" },
  { label: "کنسول بازی", hint: "خانگی و دستی" },
  { label: "تلویزیون", hint: "هوشمند و ۴K" },
  { label: "دوربین", hint: "عکاسی و ویدیو" },
  { label: "لوازم خانگی", hint: "آشپزخانه و نظافت" },
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
    text: "قدمت قیمت را می‌بینی؛ قیمت کهنه هشدار دارد.",
  },
  {
    icon: ShieldIcon,
    title: "موجودی تأییدشده",
    text: "تا وقتی فروشنده تأیید نکند، «نامشخص» است.",
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
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700">
            <SparkIcon className="size-3" />
            فاز ۳ فعال: دستیار خرید داده‌محور
          </span>
          <h1 className="mt-3 text-2xl font-black leading-[1.55]">
            قبل از رفتن،
            <span className="text-brand-600"> فروشگاه درست</span> را پیدا کن.
          </h1>
          <p className="mt-2 text-xs leading-6 text-muted">
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
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-brand-700">
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
                className="rounded-full border border-line bg-page px-2.5 py-1 text-[10px] font-medium text-muted transition hover:border-brand-200 hover:text-brand-700"
              >
                {query}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="شفافیت داده" className="grid grid-cols-3 gap-2">
        {trustItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-2xl border border-line bg-surface p-2.5"
            >
              <Icon className="size-4 text-brand-600" />
              <p className="mt-1.5 text-[10px] font-extrabold">{item.title}</p>
              <p className="mt-1 text-[9px] leading-5 text-muted">{item.text}</p>
            </div>
          );
        })}
      </section>

      <section aria-labelledby="categories-title">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 id="categories-title" className="text-sm font-bold">
            دسته‌های پرطرفدار
          </h2>
          <Link
            href="/search"
            className="text-[10px] font-semibold text-brand-700"
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
                <span className="block truncate text-[11px] font-bold">
                  {category.label}
                </span>
                <span className="mt-0.5 block text-[9px] text-muted">
                  {category.hint}
                </span>
              </span>
              <ChevronLeftIcon className="size-3.5 text-muted/50 transition group-hover:text-brand-600" />
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-4">
        <div className="flex items-center gap-2">
          <ScaleIcon className="size-4 text-brand-600" />
          <h2 className="text-sm font-bold">مسیر تا تصمیم</h2>
        </div>
        <ol className="mt-3 space-y-2.5">
          {steps.map((step, index) => (
            <li key={step.title} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[9px] font-bold text-brand-700">
                {new Intl.NumberFormat("fa-IR").format(index + 1)}
              </span>
              <div>
                <p className="text-[11px] font-bold">{step.title}</p>
                <p className="mt-0.5 text-[10px] leading-5 text-muted">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-card border border-warning/20 bg-warning/5 p-3.5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-warning">
          <PinIcon className="size-3.5" />
          این نسخه با دادهٔ نمونه کار می‌کند
        </p>
        <p className="mt-1.5 text-[10px] leading-6 text-muted">
          ۳۰۰ فروشگاه، ۲٬۰۰۰ محصول و ۴٬۰۰۰ آفر نمونه. قیمت‌ها، ساعت‌ها و
          مختصات ساختگی‌اند و تا تأیید فروشنده قابل اتکا نیستند.
        </p>
      </section>

      <HealthStatus />

      <footer className="mt-auto text-center text-[10px] leading-6 text-muted">
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
