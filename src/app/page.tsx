import { HealthStatus } from "@/components/health-status";

const steps = [
  {
    title: "بگو چه می‌خواهی",
    description: "بودجه، محله و شرایط خرید را از جملهٔ تو می‌فهمد.",
  },
  {
    title: "مقایسه کن",
    description: "گزینه‌ها را کنار هم می‌بینی و دلیل پیشنهاد را می‌خوانی.",
  },
  {
    title: "از فروشنده بپرس",
    description: "قیمت و موجودی، مستقیم از خود فروشگاه پیگیری می‌شود.",
  },
  {
    title: "دقیق برو",
    description: "آدرس پاساژ، طبقه و واحد، همراه با وضعیت باز بودن.",
  },
];

const faDigits = new Intl.NumberFormat("fa-IR");

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-10 pt-6 sm:max-w-lg">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-11 place-items-center rounded-2xl bg-brand-500 text-2xl font-black text-white shadow-sm shadow-brand-500/25"
          >
            ت
          </span>
          <div className="leading-tight">
            <p className="text-lg font-extrabold">ترب‌یار</p>
            <p className="text-xs text-muted">دستیار خرید حضوری</p>
          </div>
        </div>
        <span className="rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-[11px] font-medium text-brand-700">
          فاز {faDigits.format(0)}
        </span>
      </header>

      <section className="rounded-card border border-line bg-surface p-5 shadow-sm">
        <p className="mb-2 text-xs font-semibold text-brand-600">
          خرید حضوری، بدون رفت‌وآمد بی‌فایده
        </p>
        <h1 className="text-2xl font-black leading-[1.5]">
          قبل از رفتن به بازار،
          <span className="text-brand-600"> مطمئن شو.</span>
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          ترب‌یار کمک می‌کند محصول را پیدا کنی، فروشنده‌های اطراف را مقایسه
          کنی و قبل از سفر، قیمت و موجودی را از خود فروشگاه بپرسی.
        </p>
      </section>

      <section aria-labelledby="steps-title" className="flex flex-col gap-3">
        <h2 id="steps-title" className="px-1 text-sm font-bold text-ink">
          مسیر محصول در چهار قدم
        </h2>
        <ol className="flex flex-col gap-2.5">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="flex items-start gap-3 rounded-2xl border border-line bg-surface/90 p-4"
            >
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                {faDigits.format(index + 1)}
              </span>
              <div>
                <p className="text-sm font-bold">{step.title}</p>
                <p className="mt-1 text-xs leading-6 text-muted">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <HealthStatus />

      <footer className="mt-auto pt-2 text-center text-[11px] leading-6 text-muted">
        فاز {faDigits.format(0)}: اسکلت آماده است. داده‌ها، جست‌وجو و دستیار در
        فازهای بعدی فعال می‌شوند.
        <br />
        <a
          href="/api/health"
          className="font-medium text-brand-700 underline underline-offset-4"
        >
          مشاهدهٔ وضعیت خام سرور
        </a>
      </footer>
    </main>
  );
}
