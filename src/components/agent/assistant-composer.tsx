"use client";

import type { FormEvent, RefObject } from "react";
import { ArrowLeftIcon, CloseIcon } from "@/components/ui/icons";

type AssistantComposerProps = {
  draft: string;
  setDraft: (value: string) => void;
  busy: boolean;
  send: () => void;
  stop: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
};

export function AssistantComposer({
  draft,
  setDraft,
  busy,
  send,
  stop,
  textareaRef,
}: AssistantComposerProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-page/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
      <form
        onSubmit={submit}
        className="mx-auto flex w-full max-w-lg items-end gap-2"
      >
        <div className="flex min-w-0 flex-1 items-end gap-1 rounded-2xl border border-line bg-surface px-2 py-1.5 shadow-sm">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            rows={1}
            maxLength={500}
            placeholder="مثلاً: آیفون ۱۵ تا ۴۵ میلیون در ونک"
            aria-label="درخواست از دستیار"
            className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-1.5 py-1.5 text-[11px] leading-6 outline-none placeholder:text-muted/70"
          />
        </div>
        {busy ? (
          <button
            type="button"
            onClick={stop}
            className="grid size-10 shrink-0 place-items-center rounded-2xl border border-danger/20 bg-danger/5 text-danger"
            aria-label="توقف پاسخ"
          >
            <CloseIcon className="size-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!draft.trim()}
            className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-500 text-white shadow-sm shadow-brand-500/25 transition disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="ارسال درخواست"
          >
            <ArrowLeftIcon className="size-4" />
          </button>
        )}
      </form>
      <p className="mx-auto mt-1.5 max-w-lg text-center text-[8px] text-muted">
        قیمت‌ها ثبت‌شده‌اند؛ قبل از مراجعه موجودی را از فروشنده تأیید کن.
      </p>
    </div>
  );
}
