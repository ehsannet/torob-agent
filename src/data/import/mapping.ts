import { normalizePersian } from "../../lib/persian";
import type { CatalogData } from "../../db/replace";
import type { NewOffer, NewProduct, NewShop } from "../../db/schema";
import {
  asBoolean,
  asDate,
  asInteger,
  asNumber,
  asRecord,
  asString,
  asStringArray,
  parseHours,
  parsePrice,
} from "./parse";

type Row = Record<string, unknown>;

const SHOP_ID = ["id", "shop_id", "shopId", "code", "کد", "کد فروشگاه"] as const;
const SHOP_NAME = ["name", "shop_name", "shopName", "title", "نام", "نام فروشگاه"] as const;
const SHOP_ADDRESS = ["address", "address_text", "addressText", "آدرس", "نشانی"] as const;
const SHOP_BUSINESS_TYPE = ["business_type", "businessType", "نوع کسب‌وکار"] as const;
const SHOP_ACTIVITY = ["activity_category", "activityCategory", "دسته فعالیت", "حوزه فعالیت"] as const;
const SHOP_DESCRIPTION = ["description", "about", "توضیحات", "درباره"] as const;
const SHOP_IMAGES = ["images", "image_urls", "تصاویر"] as const;
const SHOP_HISTORY = ["torob_history", "torobHistory", "سابقه توروب"] as const;
const SHOP_LICENSES = ["licenses", "مجوزها"] as const;
const SHOP_MALL = ["mall_name", "mallName", "mall", "پاساژ", "نام پاساژ"] as const;
const SHOP_FLOOR = ["floor", "طبقه"] as const;
const SHOP_UNIT = ["unit", "واحد"] as const;
const SHOP_STREET = ["street", "خیابان"] as const;
const SHOP_LANDMARK = ["landmark", "نشانه"] as const;
const SHOP_LOCATION_NOTES = ["location_notes", "locationNotes", "توضیح موقعیت"] as const;
const SHOP_CONFIDENCE = ["address_confidence", "addressConfidence", "اطمینان آدرس"] as const;
const SHOP_LAT = ["latitude", "lat", "عرض جغرافیایی"] as const;
const SHOP_LNG = ["longitude", "lng", "lon", "طول جغرافیایی"] as const;
const SHOP_HOURS = ["weekly_hours", "weeklyHours", "hours", "ساعت کاری", "ساعات کاری"] as const;
const SHOP_PHONE = ["phone", "telephone", "تلفن"] as const;
const SHOP_WHATSAPP = ["whatsapp", "واتساپ"] as const;
const SHOP_BALE = ["bale", "بله"] as const;
const SHOP_INSTAGRAM = ["instagram", "اینستاگرام"] as const;
const SHOP_WEBSITE = ["website", "site", "وبسایت"] as const;
const SHOP_TOROB_PAY = ["accepts_torob_pay", "acceptsTorobPay", "پرداخت توروب"] as const;
const SHOP_INSTALLMENTS = ["offers_installments", "offersInstallments", "اقساط"] as const;
const SHOP_KALABARG = ["accepts_kalabarg", "acceptsKalabarg", "کالابرگ"] as const;
const SHOP_FAST_DELIVERY = ["has_fast_delivery", "hasFastDelivery", "ارسال سریع"] as const;
const SHOP_SAMPLE = ["is_sample", "isSample", "داده نمونه"] as const;

const PRODUCT_ID = ["id", "product_id", "productId", "code", "کد محصول"] as const;
const PRODUCT_TITLE = ["title_fa", "titleFa", "title", "name", "نام", "عنوان"] as const;
const PRODUCT_TITLE_EN = ["title_en", "titleEn", "english_title", "عنوان انگلیسی"] as const;
const PRODUCT_BRAND = ["brand", "برند"] as const;
const PRODUCT_CATEGORY = ["category", "دسته", "دسته‌بندی"] as const;
const PRODUCT_SPECS = ["specs", "specifications", "مشخصات"] as const;
const PRODUCT_DESCRIPTION = ["description", "توضیحات"] as const;
const PRODUCT_IMAGES = ["images", "image_urls", "تصاویر"] as const;
const PRODUCT_SAMPLE = ["is_sample", "isSample", "داده نمونه"] as const;

const OFFER_ID = ["id", "offer_id", "offerId", "code", "کد آفر"] as const;
const OFFER_SHOP = ["shop_id", "shopId", "shop", "کد فروشگاه"] as const;
const OFFER_PRODUCT = ["product_id", "productId", "product", "کد محصول"] as const;
const OFFER_TITLE = ["seller_title", "sellerTitle", "title", "عنوان فروشنده"] as const;
const OFFER_DESCRIPTION = ["seller_description", "sellerDescription", "توضیحات فروشنده"] as const;
const OFFER_PRICE = ["price", "قیمت"] as const;
const OFFER_PRICE_UNIT = ["price_unit", "priceUnit", "currency", "واحد قیمت"] as const;
const OFFER_WARRANTY = ["warranty_provider", "warrantyProvider", "گارانتی"] as const;
const OFFER_WARRANTY_MONTHS = [
  "warranty_duration_months",
  "warrantyDurationMonths",
  "مدت گارانتی",
] as const;
const OFFER_LAST_CHANGE = [
  "last_price_change_at",
  "lastPriceChangeAt",
  "last_price_change",
  "آخرین تغییر قیمت",
] as const;
const OFFER_SAMPLE = ["is_sample", "isSample", "داده نمونه"] as const;

function read(row: Row, aliases: readonly string[]): unknown {
  for (const alias of aliases) {
    const value = row[alias];
    if (value !== undefined && value !== null && value !== "") return value;
  }

  const normalizedAliases = new Set(aliases.map((alias) => normalizePersian(alias)));
  for (const [key, value] of Object.entries(row)) {
    if (value === undefined || value === null || value === "") continue;
    if (normalizedAliases.has(normalizePersian(key))) return value;
  }
  return undefined;
}

function requiredString(row: Row, aliases: readonly string[], context: string): string {
  const value = asString(read(row, aliases));
  if (!value) throw new Error(`${context}: missing required field (${aliases[0]})`);
  return value;
}

function sampleFlag(row: Row, aliases: readonly string[]): boolean {
  return asBoolean(read(row, aliases)) ?? false;
}

function confidenceValue(row: Row): number {
  const parsed = asNumber(read(row, SHOP_CONFIDENCE));
  if (parsed === null) return 0.5;
  const normalized = parsed > 1 ? parsed / 100 : parsed;
  return Math.min(1, Math.max(0, normalized));
}

export function mapShopRow(row: Row, index: number): NewShop {
  const context = `shops[${index}]`;
  const name = requiredString(row, SHOP_NAME, context);
  const addressText = asString(read(row, SHOP_ADDRESS)) ?? "آدرس نامشخص";
  const latitude = asNumber(read(row, SHOP_LAT));
  const longitude = asNumber(read(row, SHOP_LNG));

  return {
    id: asString(read(row, SHOP_ID)) ?? `import-shop-${String(index + 1).padStart(4, "0")}`,
    name,
    nameNormalized: normalizePersian(name),
    businessType: asString(read(row, SHOP_BUSINESS_TYPE)),
    activityCategory: asString(read(row, SHOP_ACTIVITY)),
    description: asString(read(row, SHOP_DESCRIPTION)),
    images: asStringArray(read(row, SHOP_IMAGES)),
    torobHistory: asString(read(row, SHOP_HISTORY)),
    licenses: asStringArray(read(row, SHOP_LICENSES)),
    addressText,
    addressNormalized: normalizePersian(addressText),
    mallName: asString(read(row, SHOP_MALL)),
    floor: asString(read(row, SHOP_FLOOR)),
    unit: asString(read(row, SHOP_UNIT)),
    street: asString(read(row, SHOP_STREET)),
    landmark: asString(read(row, SHOP_LANDMARK)),
    locationNotes: asString(read(row, SHOP_LOCATION_NOTES)),
    addressConfidence: addressText === "آدرس نامشخص" ? 0.2 : confidenceValue(row),
    latitude,
    longitude,
    weeklyHours: parseHours(read(row, SHOP_HOURS)),
    phone: asString(read(row, SHOP_PHONE)),
    whatsapp: asString(read(row, SHOP_WHATSAPP)),
    bale: asString(read(row, SHOP_BALE)),
    instagram: asString(read(row, SHOP_INSTAGRAM)),
    website: asString(read(row, SHOP_WEBSITE)),
    acceptsTorobPay: asBoolean(read(row, SHOP_TOROB_PAY)) ?? false,
    offersInstallments: asBoolean(read(row, SHOP_INSTALLMENTS)) ?? false,
    acceptsKalabarg: asBoolean(read(row, SHOP_KALABARG)) ?? false,
    hasFastDelivery: asBoolean(read(row, SHOP_FAST_DELIVERY)) ?? false,
    isSample: sampleFlag(row, SHOP_SAMPLE),
  };
}

export function mapProductRow(row: Row, index: number): NewProduct {
  const context = `products[${index}]`;
  const titleFa = requiredString(row, PRODUCT_TITLE, context);
  const brand = asString(read(row, PRODUCT_BRAND));

  return {
    id: asString(read(row, PRODUCT_ID)) ?? `import-product-${String(index + 1).padStart(5, "0")}`,
    titleFa,
    titleFaNormalized: normalizePersian(titleFa),
    titleEn: asString(read(row, PRODUCT_TITLE_EN)),
    brand,
    brandNormalized: brand ? normalizePersian(brand) : null,
    category: asString(read(row, PRODUCT_CATEGORY)) ?? "نامشخص",
    specs: asRecord(read(row, PRODUCT_SPECS)),
    description: asString(read(row, PRODUCT_DESCRIPTION)),
    images: asStringArray(read(row, PRODUCT_IMAGES)),
    isSample: sampleFlag(row, PRODUCT_SAMPLE),
  };
}

export function mapOfferRow(row: Row, index: number): NewOffer {
  const context = `offers[${index}]`;
  const shopId = requiredString(row, OFFER_SHOP, context);
  const productId = requiredString(row, OFFER_PRODUCT, context);
  const sellerTitle = asString(read(row, OFFER_TITLE));
  const priceText = [read(row, OFFER_PRICE), read(row, OFFER_PRICE_UNIT)]
    .filter((value) => value !== undefined)
    .join(" ");
  const price = parsePrice(priceText);

  return {
    id: asString(read(row, OFFER_ID)) ?? `import-offer-${String(index + 1).padStart(5, "0")}`,
    shopId,
    productId,
    sellerTitle,
    sellerTitleNormalized: sellerTitle ? normalizePersian(sellerTitle) : null,
    sellerDescription: asString(read(row, OFFER_DESCRIPTION)),
    price: price.amount,
    priceUnit: price.unit,
    warrantyProvider: asString(read(row, OFFER_WARRANTY)),
    warrantyDurationMonths: asInteger(read(row, OFFER_WARRANTY_MONTHS)),
    lastPriceChangeAt: asDate(read(row, OFFER_LAST_CHANGE)),
    isSample: sampleFlag(row, OFFER_SAMPLE),
  };
}

function isRow(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rows(value: unknown, name: string): Row[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`${name} must be an array`);
  return value.map((item, index) => {
    if (!isRow(item)) throw new Error(`${name}[${index}] must be an object`);
    return item;
  });
}

function assertUnique(ids: string[], name: string): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) throw new Error(`duplicate ${name} id: ${id}`);
    seen.add(id);
  }
}

export function mapRawCatalog(input: unknown): CatalogData {
  if (!isRow(input)) throw new Error("dataset must be a JSON object");

  const shops = rows(input.shops, "shops").map(mapShopRow);
  const products = rows(input.products, "products").map(mapProductRow);
  const offers = rows(input.offers, "offers").map(mapOfferRow);

  assertUnique(shops.map((shop) => shop.id), "shop");
  assertUnique(products.map((product) => product.id), "product");
  assertUnique(offers.map((offer) => offer.id), "offer");

  const shopIds = new Set(shops.map((shop) => shop.id));
  const productIds = new Set(products.map((product) => product.id));

  offers.forEach((offer, index) => {
    if (!shopIds.has(offer.shopId)) {
      throw new Error(`offers[${index}]: unknown shop_id ${offer.shopId}`);
    }
    if (!productIds.has(offer.productId)) {
      throw new Error(`offers[${index}]: unknown product_id ${offer.productId}`);
    }
  });

  return { shops, products, offers };
}
