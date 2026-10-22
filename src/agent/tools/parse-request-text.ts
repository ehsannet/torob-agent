import { normalizePersian } from "@/lib/persian";
import type { SortKey } from "@/lib/search-types";
import { TEHRAN_DISTRICTS } from "@/lib/tehran";

export const CATEGORY_WORDS: Array<{ category: string; words: string[] }> = [
  {
    category: "موبایل",
    words: [
      "موبایل",
      "گوشی",
      "iphone",
      "آیفون",
      "ایفون",
      "سامسونگ",
      "samsung",
      "galaxy",
      "شیائومی",
      "xiaomi",
      "پیکسل",
      "pixel",
    ],
  },
  {
    category: "لپ‌تاپ",
    words: ["لپ تاپ", "لپ‌تاپ", "لپتاب", "macbook", "مک بوک", "مکبوک", "لپ"],
  },
  {
    category: "هدفون و هندزفری",
    words: ["هدفون", "هندزفری", "ایرپاد", "airpods", "headphone", "earbuds"],
  },
  {
    category: "ساعت هوشمند",
    words: ["ساعت هوشمند", "ساعت", "watch", "اپل واچ"],
  },
  {
    category: "کنسول بازی",
    words: ["کنسول", "پلی استیشن", "پلی‌استیشن", "playstation", "ps5", "xbox", "ایکس باکس"],
  },
  {
    category: "تلویزیون",
    words: ["تلویزیون", "تی وی", "tv", "اسمارت تی وی"],
  },
  {
    category: "دوربین",
    words: ["دوربین", "camera", "canon", "nikon", "سونی آلفا"],
  },
  {
    category: "لوازم خانگی",
    words: ["لوازم خانگی", "یخچال", "ماشین لباسشویی", "لباسشویی", "جارو", "مایکروویو"],
  },
];

const STOPWORDS = new Set([
  "می",
  "خوام",
  "میخوام",
  "می‌خوام",
  "میخواستم",
  "می‌خواستم",
  "دنبال",
  "پیدا",
  "کن",
  "کنم",
  "یه",
  "یک",
  "برای",
  "با",
  "و",
  "یا",
  "از",
  "به",
  "در",
  "تو",
  "همین",
  "حالا",
  "الان",
  "باز",
  "باشه",
  "باشد",
  "فروشگاه",
  "مغازه",
  "خرید",
  "بخرم",
  "بودجه",
  "بودجه‌ام",
  "بودجه ام",
  "تومان",
  "تومن",
  "میلیون",
  "ملیون",
  "هزار",
  "لطفا",
  "لطفاً",
  "سلام",
  "تهران",
  "حدود",
  "حوالی",
  "بین",
  "الی",
  "تا",
  "زیر",
  "بالای",
  "بیشتر",
  "کمتر",
  "حداکثر",
  "حداقل",
  "نهایتا",
  "نهایتاً",
  "قیمت",
  "مناسب",
  "خوب",
  "بهترین",
  "موجود",
  "موجودی",
  "تایید",
  "تأیید",
  "اقساط",
  "قسطی",
  "ارسال",
  "سریع",
  "پیک",
  "کالابرگ",
  "کالابارگ",
  "تورب",
  "پی",
  "پرداخت",
  "محله",
  "منطقه",
  "نزدیک",
  "اطراف",
  "حدودا",
  "تقریبا",
  "تقریباً",
]);

const UNIT_MULTIPLIER: Record<string, number> = {
  "میلیون": 1_000_000,
  "ملیون": 1_000_000,
  "هزار": 1_000,
  "تومان": 1,
  "تومن": 1,
};

export type BudgetMatch = {
  min: number | null;
  max: number | null;
  pattern: RegExp;
};

function parseAmount(raw: string, unit: string | undefined): number | null {
  const cleaned = raw.replace(/[,\s٬،]/g, "");
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  const multiplier = unit ? (UNIT_MULTIPLIER[unit] ?? 1) : 1;
  const amount = Math.round(value * multiplier);
  return amount > 0 && amount <= 1_000_000_000_000 ? amount : null;
}

export function extractBudget(text: string): BudgetMatch | null {
  const range = text.match(
    /(?:بین|از)\s*([\d.]+)\s*(?:تا|الی|-)\s*([\d.]+)\s*(میلیون|ملیون|هزار|تومان|تومن)/,
  );
  if (range) {
    return {
      min: parseAmount(range[1], range[3]),
      max: parseAmount(range[2], range[3]),
      pattern: /(?:بین|از)\s*[\d.]+\s*(?:تا|الی|-)\s*[\d.]+\s*(?:میلیون|ملیون|هزار|تومان|تومن)/g,
    };
  }

  const max = text.match(
    /(?:تا|زیر|حداکثر|کمتر از|نهایتا|نهایتاً)\s*([\d.]+)\s*(میلیون|ملیون|هزار|تومان|تومن)?/,
  );
  if (max) {
    return {
      min: null,
      max: parseAmount(max[1], max[2]),
      pattern: /(?:تا|زیر|حداکثر|کمتر از|نهایتا|نهایتاً)\s*[\d.]+\s*(?:میلیون|ملیون|هزار|تومان|تومن)?/g,
    };
  }

  const min = text.match(
    /(?:بالای|بیشتر از|بیش از)\s*([\d.]+)\s*(میلیون|ملیون|هزار|تومان|تومن)?/,
  );
  if (min) {
    return {
      min: parseAmount(min[1], min[2]),
      max: null,
      pattern: /(?:بالای|بیشتر از|بیش از)\s*[\d.]+\s*(?:میلیون|ملیون|هزار|تومان|تومن)?/g,
    };
  }

  const budget = text.match(
    /(?:بودجه(?:\s*ام)?|قیمت|حوالی|حدود)\s*([\d.]+)\s*(میلیون|ملیون|هزار|تومان|تومن)?/,
  );
  if (budget) {
    return {
      min: null,
      max: parseAmount(budget[1], budget[2]),
      pattern: /(?:بودجه(?:\s*ام)?|قیمت|حوالی|حدود)\s*[\d.]+\s*(?:میلیون|ملیون|هزار|تومان|تومن)?/g,
    };
  }

  const bare = text.match(/([\d.]+)\s*(میلیون|ملیون|هزار)\s*(?:تومان|تومن)?/);
  if (bare) {
    return {
      min: null,
      max: parseAmount(bare[1], bare[2]),
      pattern: /[\d.]+\s*(?:میلیون|ملیون|هزار)\s*(?:تومان|تومن)?/g,
    };
  }

  return null;
}

export function detectCategory(text: string): string | null {
  for (const item of CATEGORY_WORDS) {
    if (item.words.some((word) => text.includes(normalizePersian(word)))) {
      return item.category;
    }
  }
  return null;
}

export function detectDistrict(text: string): string | null {
  const districts = [...TEHRAN_DISTRICTS].sort(
    (a, b) => b.name.length - a.name.length,
  );
  for (const district of districts) {
    if (text.includes(normalizePersian(district.name))) {
      return district.slug;
    }
  }
  return null;
}

export function detectSort(text: string): SortKey | null {
  if (/ارزان\s*ترین|کم\s*ترین\s*قیمت/.test(text)) return "price";
  if (/نزدیک\s*ترین/.test(text)) return "distance";
  if (/جدید\s*ترین|به\s*روز\s*ترین/.test(text)) return "newest";
  return null;
}

export function cleanQuery(text: string, budget: BudgetMatch | null): string {
  let cleaned = text;
  if (budget) cleaned = cleaned.replace(budget.pattern, " ");

  for (const district of TEHRAN_DISTRICTS) {
    cleaned = cleaned.replaceAll(normalizePersian(district.name), " ");
  }

  cleaned = cleaned
    .replace(/نزدیک\s*من|همین\s*اطراف|اطراف\s*من/g, " ")
    .replace(/همین\s*حالا\s*باز|الان\s*باز/g, " ")
    .replace(/ارسال\s*سریع|تحویل\s*سریع|خرید\s*اقساطی|پرداخت\s*تورب|کالا\s*برگ/g, " ");

  return cleaned
    .split(/\s+/)
    .filter((token) => token && !STOPWORDS.has(token))
    .filter((token) => !/^[.,،؛:!؟?]+$/.test(token))
    .slice(0, 8)
    .join(" ")
    .trim();
}
