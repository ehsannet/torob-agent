import type { Metadata } from "next";
import { AssistantView } from "@/components/agent/assistant-view";

export const metadata: Metadata = {
  title: "دستیار خرید | ترب‌یار",
  description:
    "درخواست خریدت را فارسی بنویس و پیشنهاد داده‌محور فروشگاه‌های حضوری تهران را بگیر.",
};

export default function AssistantPage() {
  return <AssistantView />;
}
