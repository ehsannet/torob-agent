"use client";

import { getDistrict } from "@/lib/tehran";
import { BrandHeader } from "@/components/ui/brand-header";
import { SparkIcon } from "@/components/ui/icons";
import { AgentThread } from "./agent-thread";
import { AssistantComposer } from "./assistant-composer";
import { UsageBadge } from "./usage-badge";
import { useAgentChat } from "./use-agent-chat";

const QUICK_PROMPTS = [
  "گوشی آیفون ۱۵ تا ۴۵ میلیون در ونک",
  "هدفون بی‌سیم باز الان نزدیک من",
  "ارزان‌ترین لپ‌تاپ تا ۸۰ میلیون",
  "برای خرید PS5 کجا برم؟",
];

export function AssistantView() {
  const {
    messages,
    draft,
    setDraft,
    busy,
    usage,
    context,
    send,
    stop,
    endRef,
    textareaRef,
  } = useAgentChat();

  const districtName = context?.district
    ? getDistrict(context.district)?.name
    : null;
  const hasLocation = context?.lat != null && context?.lng != null;

  return (
    <>
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pb-36 pt-5">
        <BrandHeader backHref="/" backLabel="بازگشت به خانه" />

        <section className="relative overflow-hidden rounded-card border border-line bg-surface p-5 shadow-sm">
          <div
            aria-hidden="true"
            className="absolute -left-10 -top-12 size-36 rounded-full bg-brand-100/60 blur-3xl"
          />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700">
                  <SparkIcon className="size-3" />
                  دستیار خرید حضوری
                </span>
                <h1 className="mt-3 text-xl font-black leading-8">
                  بگو چی می‌خوای؛
                  <span className="text-brand-600"> فروشگاه مناسب</span> را
                  پیدا می‌کنم.
                </h1>
              </div>
              <UsageBadge usage={usage} className="shrink-0" />
            </div>
            <p className="mt-2 text-[11px] leading-6 text-muted">
              بودجه، محله و مدل را بنویس. پاسخ فقط بر اساس قیمت‌های ثبت‌شده و
              فاصلهٔ فروشگاه‌های تهران ساخته می‌شود.
            </p>
            <p className="mt-2 flex items-center gap-1 text-[9px] text-muted">
              <span className="size-1.5 rounded-full bg-success" />
              {hasLocation
                ? "فیلتر موقعیت مکانی فعلی فعال است"
                : districtName
                  ? `محلهٔ فعلی: ${districtName}`
                  : "بدون محدودهٔ مکانی؛ می‌توانی محله را در متن بگویی"}
            </p>
          </div>
        </section>

        {messages.length === 0 ? (
          <section aria-label="نمونه درخواست‌ها">
            <p className="mb-2 text-[10px] font-bold text-muted">
              یک نمونه را بزن یا خودت بنویس:
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void send(prompt)}
                  className="rounded-full border border-line bg-surface px-3 py-2 text-[10px] font-semibold text-muted transition hover:border-brand-200 hover:text-brand-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <AgentThread messages={messages} endRef={endRef} />
      </main>

      <AssistantComposer
        draft={draft}
        setDraft={setDraft}
        busy={busy}
        send={() => void send()}
        stop={stop}
        textareaRef={textareaRef}
      />
    </>
  );
}
