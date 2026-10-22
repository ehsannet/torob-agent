"use client";

import { useEffect, useRef, useState } from "react";
import type {
  AgentContext,
  AgentMode,
  AgentResult,
  AgentStreamEvent,
  AgentUsageSnapshot,
} from "@/lib/agent-types";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: string;
  mode?: AgentMode;
  result?: AgentResult;
  error?: boolean;
};

function readContext(): AgentContext | undefined {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  const district = params.get("district");
  const latRaw = params.get("lat");
  const lngRaw = params.get("lng");
  const radiusRaw = params.get("radiusKm");
  const lat = latRaw !== null ? Number(latRaw) : null;
  const lng = lngRaw !== null ? Number(lngRaw) : null;
  const radiusKm = radiusRaw !== null ? Number(radiusRaw) : 5;
  const hasLocation =
    lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng);

  return {
    district,
    lat: hasLocation ? lat : null,
    lng: hasLocation ? lng : null,
    radiusKm:
      Number.isFinite(radiusKm) && radiusKm >= 0.5 && radiusKm <= 30
        ? radiusKm
        : 5,
  };
}

function nextId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useAgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [usage, setUsage] = useState<AgentUsageSnapshot | null>(null);
  const [context, setContext] = useState<AgentContext | undefined>();
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const refreshUsage = async () => {
    try {
      const response = await fetch("/api/agent/usage", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        usage?: AgentUsageSnapshot;
      };
      if (payload.usage) setUsage(payload.usage);
    } catch {
      return;
    }
  };

  useEffect(() => {
    let active = true;
    const initial = readContext();
    const initialQuery =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("q")
        : null;

    void Promise.resolve().then(async () => {
      if (!active) return;
      setContext(initial);
      if (initialQuery) setDraft(initialQuery);
      await refreshUsage();
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const updateAssistant = (
    id: string,
    updater: (message: ChatMessage) => ChatMessage,
  ) => {
    setMessages((previous) =>
      previous.map((message) => (message.id === id ? updater(message) : message)),
    );
  };

  const handleEvent = (id: string, event: AgentStreamEvent) => {
    if (event.type === "status") {
      updateAssistant(id, (message) => ({
        ...message,
        status: event.stage === "done" ? undefined : event.message,
      }));
      return;
    }
    if (event.type === "delta") {
      updateAssistant(id, (message) => ({
        ...message,
        content: message.content + event.text,
        status: undefined,
      }));
      return;
    }
    if (event.type === "result") {
      updateAssistant(id, (message) => ({
        ...message,
        result: event.result,
        mode: event.result.mode,
      }));
      return;
    }
    if (event.type === "usage") {
      setUsage(event.usage);
      return;
    }
    if (event.type === "done") {
      updateAssistant(id, (message) => ({
        ...message,
        mode: event.mode,
        status: undefined,
      }));
      return;
    }
    updateAssistant(id, (message) => ({
      ...message,
      status: undefined,
      error: true,
      content: message.content
        ? `${message.content}\n\n${event.message}`
        : event.message,
    }));
  };

  const send = async (value?: string) => {
    const text = (value ?? draft).trim();
    if (!text || busy) return;

    const userMessage: ChatMessage = {
      id: nextId("user"),
      role: "user",
      content: text,
    };
    const assistantId = nextId("assistant");
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      status: "در حال ارسال به دستیار…",
    };

    setMessages((previous) => [...previous, userMessage, assistantMessage]);
    setDraft("");
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: context ?? readContext(),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "درخواست دستیار پذیرفته نشد.");
      }

      if (!response.body) throw new Error("پاسخ دستیار خالی بود.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const parseLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        try {
          handleEvent(assistantId, JSON.parse(trimmed) as AgentStreamEvent);
        } catch {
          return;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) parseLine(line);
      }

      buffer += decoder.decode();
      if (buffer.trim()) parseLine(buffer);
    } catch (error) {
      const aborted = controller.signal.aborted;
      const message = aborted
        ? "پاسخ متوقف شد."
        : error instanceof Error
          ? error.message
          : "ارتباط با دستیار برقرار نشد.";
      updateAssistant(assistantId, (current) => ({
        ...current,
        status: undefined,
        error: true,
        content: current.content
          ? `${current.content}\n\n${message}`
          : message,
      }));
    } finally {
      abortRef.current = null;
      setBusy(false);
      refreshUsage();
      textareaRef.current?.focus();
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setBusy(false);
  };

  return {
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
  };
}
