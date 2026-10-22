export function toToman(
  price: number | null | undefined,
  unit: string | null | undefined,
): number | null {
  if (price === null || price === undefined || !Number.isFinite(price)) {
    return null;
  }

  if (unit === "RIAL") return Math.round(price / 10);
  return Math.round(price);
}

const persianNumber = new Intl.NumberFormat("fa-IR");

export function formatNumber(value: number): string {
  return persianNumber.format(value);
}

export function formatToman(price: number | null | undefined): string {
  if (price === null || price === undefined) return "نامشخص";
  return `${formatNumber(price)} تومان`;
}

export function formatPriceRange(
  min: number | null,
  max: number | null,
): string {
  if (min === null && max === null) return "قیمت ثبت نشده";
  if (min === null) return `تا ${formatToman(max)}`;
  if (max === null || min === max) return formatToman(min);
  return `${formatNumber(min)} تا ${formatToman(max)}`;
}

const persianDate = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  dateStyle: "medium",
});

export function formatAbsoluteDate(value: Date | string | null): string {
  if (!value) return "نامشخص";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "نامشخص";
  return persianDate.format(date);
}

export function formatRelativeTime(
  value: Date | string | null,
  now = new Date(),
): string {
  if (!value) return "نامشخص";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "نامشخص";

  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return "کمتر از یک ساعت پیش";

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${formatNumber(hours)} ساعت پیش`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${formatNumber(days)} روز پیش`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${formatNumber(months)} ماه پیش`;

  return `${formatNumber(Math.floor(months / 12))} سال پیش`;
}

export const STALE_PRICE_DAYS = 14;

export function isStalePrice(
  value: Date | string | null,
  now = new Date(),
): boolean {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return now.getTime() - date.getTime() > STALE_PRICE_DAYS * 86_400_000;
}

export function formatPriceAge(
  value: Date | string | null,
  now = new Date(),
): string {
  if (!value) return "نامشخص";
  return `${formatRelativeTime(value, now)} (${formatAbsoluteDate(value)})`;
}
