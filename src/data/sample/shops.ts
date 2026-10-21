import { normalizePersian, toPersianDigits } from "../../lib/persian";
import { WEEKDAYS, type TimeRange, type WeeklyHours } from "../../lib/hours";
import type { NewShop } from "../../db/schema";
import { CATEGORIES, type CategoryCatalog } from "./catalog";
import { chance, jitter, pick, randInt, type Rng } from "./random";
import {
  BUSINESS_TYPES,
  DISTRICTS,
  FLOORS,
  LANDMARKS,
  MALLS,
  NAME_PREFIXES,
  NAME_SUFFIXES,
  SCHEDULES,
  SHOP_COUNT,
  STREETS,
} from "./constants";

function makeWeeklyHours(rng: Rng): WeeklyHours {
  const schedule = pick(rng, SCHEDULES);
  const hasBreak = chance(rng, 0.15);
  const ranges: TimeRange[] = hasBreak
    ? [
        { open: schedule.open, close: "13:30" },
        { open: "15:00", close: schedule.close },
      ]
    : [{ open: schedule.open, close: schedule.close }];

  const result: WeeklyHours = {};
  for (const day of WEEKDAYS) {
    if (day === "friday") {
      result[day] = chance(rng, 0.2) ? [{ open: "16:00", close: "21:00" }] : [];
    } else {
      result[day] = ranges.map((range) => ({ ...range }));
    }
  }
  return result;
}

function createShopName(rng: Rng, district: string, used: Set<string>): string {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const candidate = `${pick(rng, NAME_PREFIXES)} ${pick(rng, NAME_SUFFIXES)} ${district}`;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
  const fallback = `${pick(rng, NAME_PREFIXES)} ${pick(rng, NAME_SUFFIXES)} ${district} ${used.size + 1}`;
  used.add(fallback);
  return fallback;
}

export function buildShops(rng: Rng): NewShop[] {
  const shops: NewShop[] = [];
  const usedNames = new Set<string>();

  for (let index = 1; index <= SHOP_COUNT; index += 1) {
    const id = `shop-${String(index).padStart(4, "0")}`;
    const district = pick(rng, DISTRICTS);
    const focus = CATEGORIES[(index - 1) % CATEGORIES.length] as CategoryCatalog;
    const name = createShopName(rng, district.name, usedNames);
    const hasMall = chance(rng, 0.6);
    const mall = hasMall ? pick(rng, MALLS) : null;
    const street = pick(rng, STREETS);
    const floor = hasMall ? pick(rng, FLOORS) : null;
    const unit = hasMall ? toPersianDigits(randInt(rng, 1, 40)) : null;
    const plaque = toPersianDigits(randInt(rng, 1, 250));
    const addressText = hasMall
      ? `تهران، ${district.name}، ${street}، ${mall}، طبقه ${floor}، واحد ${unit}`
      : `تهران، ${district.name}، ${street}، پلاک ${plaque}`;

    const hasCoordinates = chance(rng, 0.95);
    const latitude = hasCoordinates
      ? Number((district.latitude + jitter(rng, 0.012)).toFixed(5))
      : null;
    const longitude = hasCoordinates
      ? Number((district.longitude + jitter(rng, 0.012)).toFixed(5))
      : null;

    const hasHours = chance(rng, 0.85);
    const weeklyHours = hasHours ? makeWeeklyHours(rng) : null;
    const lowConfidence = chance(rng, 0.1);
    const addressConfidence = lowConfidence
      ? Number((0.35 + rng() * 0.2).toFixed(2))
      : Number((0.72 + rng() * 0.26).toFixed(2));

    const phoneDigits = String(randInt(rng, 10_000_000, 99_999_999));
    const hasWhatsapp = chance(rng, 0.5);
    const hasBale = chance(rng, 0.35);
    const hasInstagram = chance(rng, 0.45);
    const hasWebsite = chance(rng, 0.1);

    shops.push({
      id,
      name,
      nameNormalized: normalizePersian(name),
      businessType: pick(rng, BUSINESS_TYPES),
      activityCategory: focus.labelFa,
      description: `فروشگاه نمونه در حوزه ${focus.labelFa}؛ این رکورد برای آزمون دستیار خرید ساخته شده است.`,
      images: [],
      torobHistory: chance(rng, 0.4)
        ? "سابقه نمایش در توروب (داده نمونه)"
        : null,
      licenses: chance(rng, 0.7) ? ["پروانه کسب (نمونه)"] : [],
      addressText,
      addressNormalized: normalizePersian(addressText),
      mallName: mall,
      floor,
      unit,
      street,
      landmark: chance(rng, 0.3) ? pick(rng, LANDMARKS) : null,
      locationNotes: chance(rng, 0.3) ? `نزدیک ${pick(rng, LANDMARKS)}` : null,
      addressConfidence,
      latitude,
      longitude,
      weeklyHours,
      phone: `021-${phoneDigits}`,
      whatsapp: hasWhatsapp ? `+9821${phoneDigits}` : null,
      bale: hasBale ? `+9821${phoneDigits}` : null,
      instagram: hasInstagram
        ? `torob_sample_${String(index).padStart(4, "0")}`
        : null,
      website: hasWebsite ? `https://example.com/shops/${id}` : null,
      acceptsTorobPay: chance(rng, 0.3),
      offersInstallments: chance(rng, 0.45),
      acceptsKalabarg: chance(rng, 0.2),
      hasFastDelivery: chance(rng, 0.15),
      isSample: true,
    });
  }

  return shops;
}
