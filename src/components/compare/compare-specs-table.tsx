import { formatDistanceKm } from "@/lib/geo";
import {
  formatNumber,
  formatPriceRange,
  formatRelativeTime,
} from "@/lib/price";
import type { ProductGroup } from "@/lib/search-types";
import { summarizeStock } from "@/lib/ui-labels";

type CompareSpecsTableProps = {
  groups: ProductGroup[];
};

type Row = {
  label: string;
  values: string[];
};

export function CompareSpecsTable({ groups }: CompareSpecsTableProps) {
  const specKeys = Array.from(
    new Set(groups.flatMap((group) => Object.keys(group.product.specs))),
  );

  const rows: Row[] = [
    {
      label: "برند",
      values: groups.map((group) => group.product.brand ?? "نامشخص"),
    },
    {
      label: "دسته",
      values: groups.map((group) => group.product.category),
    },
    {
      label: "بازهٔ قیمت",
      values: groups.map((group) =>
        formatPriceRange(group.priceMin, group.priceMax),
      ),
    },
    {
      label: "تعداد فروشگاه",
      values: groups.map((group) => formatNumber(group.shopCount)),
    },
    {
      label: "نزدیک‌ترین فروشگاه",
      values: groups.map((group) => formatDistanceKm(group.nearestDistanceKm)),
    },
    {
      label: "فروشگاه باز",
      values: groups.map((group) => formatNumber(group.openNowCount)),
    },
    {
      label: "موجودی تأییدشده",
      values: groups.map((group) => summarizeStock(group)),
    },
    {
      label: "آخرین تغییر قیمت",
      values: groups.map((group) =>
        group.latestPriceChangeAt
          ? formatRelativeTime(group.latestPriceChangeAt)
          : "نامشخص",
      ),
    },
    ...specKeys.map((key) => ({
      label: key,
      values: groups.map((group) => group.product.specs[key] ?? "—"),
    })),
  ];

  return (
    <section className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-extrabold">جدول مقایسه</h2>
        <p className="mt-1 text-[12px] text-muted">
          مقادیر نامشخص را قبل از خرید از فروشنده بپرس.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table
          style={{ minWidth: `${72 + groups.length * 150}px` }}
          className="w-full border-collapse text-right text-[12px]"
        >
          <thead>
            <tr className="bg-page/60">
              <th className="sticky right-0 z-10 min-w-24 border-b border-line bg-page px-3 py-2.5 text-[12px] font-bold text-muted">
                ویژگی
              </th>
              {groups.map((group) => (
                <th
                  key={group.product.id}
                  className="min-w-32 border-b border-line px-3 py-2.5 text-[12px] font-bold"
                >
                  <span className="line-clamp-2">{group.product.titleFa}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="odd:bg-white even:bg-page/30">
                <th className="sticky right-0 z-10 border-b border-line bg-inherit px-3 py-2.5 text-[12px] font-semibold text-muted">
                  {row.label}
                </th>
                {row.values.map((value, index) => (
                  <td
                    key={`${row.label}-${groups[index]?.product.id ?? index}`}
                    className="border-b border-line px-3 py-2.5 leading-5"
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
