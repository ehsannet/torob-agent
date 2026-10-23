import Link from "next/link";
import { SearchIcon } from "@/components/ui/icons";
import { PageStatus } from "@/components/ui/page-status";

export default function NotFound() {
  return (
    <PageStatus
      eyebrow="۴۰۴"
      title="این صفحه پیدا نشد"
      description="ممکن است نشانی عوض شده باشد. از جست‌وجو شروع کن یا به خانه برگرد."
      icon={<SearchIcon className="size-6" />}
      actions={
        <>
          <Link
            href="/search"
            className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
          >
            رفتن به جست‌وجو
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-brand-200 hover:text-brand-700"
          >
            خانه
          </Link>
        </>
      }
    />
  );
}
