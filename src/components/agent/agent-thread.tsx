"use client";

import type { RefObject } from "react";
import { cn } from "@/lib/cn";
import { SparkIcon } from "@/components/ui/icons";
import { AgentResultView } from "./agent-result";
import type { ChatMessage } from "./use-agent-chat";

type AgentThreadProps = {
  messages: ChatMessage[];
  endRef: RefObject<HTMLDivElement | null>;
};

export function AgentThread({ messages, endRef }: AgentThreadProps) {
  return (
    <div className="space-y-4" aria-live="polite">
      {messages.map((message) =>
        message.role === "user" ? (
          <div key={message.id} className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-ink px-3.5 py-2.5 text-[11px] leading-6 text-white">
              {message.content}
            </div>
          </div>
        ) : (
          <div key={message.id} className="flex items-start gap-2">
            <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-xl bg-brand-500 text-white shadow-sm shadow-brand-500/25">
              <SparkIcon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "rounded-2xl rounded-tl-md border px-3.5 py-2.5 text-[11px] leading-6",
                  message.error
                    ? "border-danger/20 bg-danger/5 text-danger"
                    : "border-line bg-surface text-ink",
                )}
              >
                {message.content ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <p className="flex items-center gap-1.5 text-muted">
                    <span className="flex gap-0.5">
                      <span className="size-1.5 animate-pulse rounded-full bg-brand-500/60" />
                      <span className="size-1.5 animate-pulse rounded-full bg-brand-500/60 [animation-delay:150ms]" />
                      <span className="size-1.5 animate-pulse rounded-full bg-brand-500/60 [animation-delay:300ms]" />
                    </span>
                    {message.status ?? "در حال آماده‌سازی…"}
                  </p>
                )}
              </div>
              {message.result ? <AgentResultView result={message.result} /> : null}
            </div>
          </div>
        ),
      )}
      <div ref={endRef} />
    </div>
  );
}
