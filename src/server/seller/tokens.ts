import { createHash, randomBytes } from "node:crypto";
import type {
  SellerCheckStatus,
  SellerQuestionView,
  SellerTimelineStep,
} from "@/lib/seller-types";

export type SellerChannelKind = "link" | "simulator";

export type SimulationOutcome = "in_stock" | "out_of_stock" | "no_answer";

export type SimulationPlan = {
  outcome: SimulationOutcome;
  delayMs: number;
};

const TOKEN_PREFIX: Record<SellerChannelKind, string> = {
  link: "lnk_",
  simulator: "sim_",
};

export function createSellerToken(channel: SellerChannelKind): string {
  return `${TOKEN_PREFIX[channel]}${randomBytes(18).toString("base64url")}`;
}

export function sellerChannelForToken(token: string): SellerChannelKind {
  return token.startsWith(TOKEN_PREFIX.simulator) ? "simulator" : "link";
}

export function isSellerToken(token: string): boolean {
  return /^(?:lnk|sim)_[a-zA-Z0-9_-]{16,64}$/.test(token);
}

export function simulationPlan(token: string): SimulationPlan {
  const seed = parseInt(createHash("sha256").update(token).digest("hex").slice(0, 8), 16);
  const bucket = seed % 100;
  const outcome: SimulationOutcome =
    bucket < 55 ? "in_stock" : bucket < 80 ? "out_of_stock" : "no_answer";
  return {
    outcome,
    delayMs: 6_000 + (seed % 6_000),
  };
}

export function buildSellerQuestions(input: {
  hasHours: boolean;
  warrantyProvider: string | null;
}): SellerQuestionView[] {
  const questions: SellerQuestionView[] = [
    { key: "stock", label: "این محصول موجود است؟" },
    { key: "price", label: "قیمت فعلی فروشگاه چقدر است؟" },
  ];
  if (input.hasHours) {
    questions.push({ key: "hours", label: "ساعت کاری ثبت‌شده درست است؟" });
  }
  if (input.warrantyProvider) {
    questions.push({ key: "warranty", label: "گارانتی ثبت‌شده معتبر است؟" });
  }
  return questions;
}

export function buildSellerTimeline(input: {
  status: SellerCheckStatus;
  createdAt: string;
  sentAt: string | null;
  viewedAt: string | null;
  answeredAt: string | null;
  expiresAt: string | null;
}): SellerTimelineStep[] {
  const sentDone = Boolean(input.sentAt) || input.status !== "created";
  const answered = input.status === "answered" && Boolean(input.answeredAt);
  const expired = input.status === "expired";

  return [
    {
      key: "created",
      label: "درخواست ساخته شد",
      at: input.createdAt,
      state: "done",
    },
    {
      key: "sent",
      label: "لینک برای فروشنده آماده شد",
      at: input.sentAt,
      state: sentDone ? "done" : "active",
    },
    {
      key: "viewed",
      label: input.viewedAt
        ? "فروشنده لینک را دید"
        : "در انتظار باز کردن لینک",
      at: input.viewedAt,
      state: input.viewedAt
        ? "done"
        : input.status === "sent" || input.status === "created"
          ? "active"
          : "pending",
    },
    {
      key: "answered",
      label: answered ? "فروشنده پاسخ داد" : "در انتظار پاسخ فروشنده",
      at: input.answeredAt,
      state: answered ? "done" : expired ? "failed" : "active",
    },
    {
      key: "expired",
      label: expired ? "بدون پاسخ بسته شد" : "اعتبار درخواست",
      at: input.expiresAt,
      state: expired ? "failed" : "pending",
    },
  ];
}
