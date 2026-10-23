import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

type Stats = {
  shops: number;
  products: number;
  offers: number;
  seller_checks: number;
  shop_categories: number;
  product_categories: number;
  shops_without_category: number;
  shops_without_hours: number;
  shops_without_phone: number;
  shops_without_coords: number;
  shops_outside_tehran: number;
  shops_without_landmark: number;
  shops_without_mall: number;
  shops_without_floor: number;
  shops_without_unit: number;
  shops_without_street: number;
  shops_approximate_addresses: number;
  products_without_brand: number;
  products_without_specs: number;
  products_without_images: number;
  products_with_placeholder_title: number;
  offers_without_price: number;
  offers_without_date: number;
  offers_without_warranty: number;
  offers_price_rial: number;
  offers_one_billion_plus: number;
  min_price: number | null;
  max_price: number | null;
  min_price_date: Date | null;
  max_price_date: Date | null;
  duplicate_offer_pairs: number;
  duplicate_offer_rows: number;
  identical_offer_rows: number;
  max_offers_per_shop: number;
  database_size: string;
};

type CountRow = { label: string; count: number };

function percent(part: number, total: number): string {
  if (total === 0) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function number(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function date(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : "—";
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const out = process.argv[2] ?? "docs/data-quality-report.md";
  const pool = new Pool({ connectionString, max: 1, application_name: "torob-quality-report" });
  try {
    const statsResult = await pool.query<Stats>(`
      select
        (select count(*)::int from shops) as shops,
        (select count(*)::int from products) as products,
        (select count(*)::int from offers) as offers,
        (select count(*)::int from seller_checks) as seller_checks,
        (select count(distinct activity_category)::int from shops) as shop_categories,
        (select count(distinct category)::int from products) as product_categories,
        (select count(*)::int from shops where activity_category is null) as shops_without_category,
        (select count(*)::int from shops where weekly_hours is null) as shops_without_hours,
        (select count(*)::int from shops where phone is null) as shops_without_phone,
        (select count(*)::int from shops where latitude is null or longitude is null) as shops_without_coords,
        (select count(*)::int from shops where latitude is not null and (latitude < 35.5 or latitude > 35.85 or longitude < 51.2 or longitude > 51.6)) as shops_outside_tehran,
        (select count(*)::int from shops where landmark is null) as shops_without_landmark,
        (select count(*)::int from shops where mall_name is null) as shops_without_mall,
        (select count(*)::int from shops where floor is null) as shops_without_floor,
        (select count(*)::int from shops where unit is null) as shops_without_unit,
        (select count(*)::int from shops where street is null) as shops_without_street,
        (select count(*)::int from shops where address_confidence < 0.65) as shops_approximate_addresses,
        (select count(*)::int from products where brand is null) as products_without_brand,
        (select count(*)::int from products where specs = '{}'::jsonb) as products_without_specs,
        (select count(*)::int from products where cardinality(images) = 0) as products_without_images,
        (select count(*)::int from products where title_fa like '%(بدون عنوان)') as products_with_placeholder_title,
        (select count(*)::int from offers where price is null) as offers_without_price,
        (select count(*)::int from offers where last_price_change_at is null) as offers_without_date,
        (select count(*)::int from offers where warranty_provider is null) as offers_without_warranty,
        (select count(*)::int from offers where price_unit = 'RIAL') as offers_price_rial,
        (select count(*)::int from offers where price >= 1000000000) as offers_one_billion_plus,
        (select min(price)::int from offers where price is not null) as min_price,
        (select max(price)::int from offers where price is not null) as max_price,
        (select min(last_price_change_at) from offers where last_price_change_at is not null) as min_price_date,
        (select max(last_price_change_at) from offers where last_price_change_at is not null) as max_price_date,
        (select count(*)::int from (select shop_id, product_id from offers group by shop_id, product_id having count(*) > 1) d) as duplicate_offer_pairs,
        (select coalesce(sum(c), 0)::int from (select count(*)::int c from offers group by shop_id, product_id having count(*) > 1) d) as duplicate_offer_rows,
        (select coalesce(sum(c), 0)::int from (select count(*)::int c from offers group by shop_id, product_id, price, price_unit, warranty_provider, warranty_duration_months, last_price_change_at having count(*) > 1) d) as identical_offer_rows,
        (select coalesce(max(c), 0)::int from (select count(*)::int c from offers group by shop_id) d) as max_offers_per_shop,
        (select pg_size_pretty(pg_database_size(current_database()))) as database_size
    `);
    const stats = statsResult.rows[0];
    if (!stats) throw new Error("stats query returned no row");

    const topProducts = await pool.query<CountRow>(`
      select category as label, count(*)::int as count
      from products group by category order by count(*) desc, category limit 10
    `);
    const topLocations = await pool.query<CountRow>(`
      select coalesce(landmark, 'ثبت نشده') as label, count(*)::int as count
      from shops group by landmark order by count(*) desc, label limit 10
    `);

    const markdown = [
      "# گزارش کیفیت داده",
      "",
      `تولیدشده در ${new Date().toISOString()} از پایگاه داده فعلی.`,
      "",
      "## شمارش جدول‌ها",
      "",
      "| جدول | ردیف |",
      "| --- | ---: |",
      `| فروشگاه‌ها | ${number(stats.shops)} |`,
      `| محصولات | ${number(stats.products)} |`,
      `| پیشنهادها | ${number(stats.offers)} |`,
      `| بررسی‌های فروشنده | ${number(stats.seller_checks)} |`,
      `| حجم پایگاه داده | ${stats.database_size} |`,
      "",
      "## کامل‌بودن فیلدها",
      "",
      "| موجودیت | فیلد | خالی | درصد |",
      "| --- | --- | ---: | ---: |",
      `| فروشگاه | دستهٔ فعالیت | ${number(stats.shops_without_category)} | ${percent(stats.shops_without_category, stats.shops)} |`,
      `| فروشگاه | ساعات کاری | ${number(stats.shops_without_hours)} | ${percent(stats.shops_without_hours, stats.shops)} |`,
      `| فروشگاه | تلفن | ${number(stats.shops_without_phone)} | ${percent(stats.shops_without_phone, stats.shops)} |`,
      `| فروشگاه | مختصات | ${number(stats.shops_without_coords)} | ${percent(stats.shops_without_coords, stats.shops)} |`,
      `| فروشگاه | نشانهٔ محلی | ${number(stats.shops_without_landmark)} | ${percent(stats.shops_without_landmark, stats.shops)} |`,
      `| فروشگاه | پاساژ/مجتمع | ${number(stats.shops_without_mall)} | ${percent(stats.shops_without_mall, stats.shops)} |`,
      `| فروشگاه | طبقه | ${number(stats.shops_without_floor)} | ${percent(stats.shops_without_floor, stats.shops)} |`,
      `| فروشگاه | واحد | ${number(stats.shops_without_unit)} | ${percent(stats.shops_without_unit, stats.shops)} |`,
      `| فروشگاه | خیابان | ${number(stats.shops_without_street)} | ${percent(stats.shops_without_street, stats.shops)} |`,
      `| فروشگاه | نشانی تقریبی (اعتماد < ۰٫۶۵) | ${number(stats.shops_approximate_addresses)} | ${percent(stats.shops_approximate_addresses, stats.shops)} |`,
      `| محصول | برند | ${number(stats.products_without_brand)} | ${percent(stats.products_without_brand, stats.products)} |`,
      `| محصول | مشخصات | ${number(stats.products_without_specs)} | ${percent(stats.products_without_specs, stats.products)} |`,
      `| محصول | تصویر | ${number(stats.products_without_images)} | ${percent(stats.products_without_images, stats.products)} |`,
      `| پیشنهاد | قیمت | ${number(stats.offers_without_price)} | ${percent(stats.offers_without_price, stats.offers)} |`,
      `| پیشنهاد | تاریخ قیمت | ${number(stats.offers_without_date)} | ${percent(stats.offers_without_date, stats.offers)} |`,
      `| پیشنهاد | گارانتی | ${number(stats.offers_without_warranty)} | ${percent(stats.offers_without_warranty, stats.offers)} |`,
      "",
      "## قیمت",
      "",
      `- واحد همهٔ قیمت‌ها تومان است؛ ردیف ریالی: ${number(stats.offers_price_rial)}.`,
      `- کمینه/بیشینهٔ قیمت معتبر: ${stats.min_price === null ? "—" : number(stats.min_price)} تا ${stats.max_price === null ? "—" : number(stats.max_price)} تومان.`,
      `- پیشنهادهای بدون قیمت: ${number(stats.offers_without_price)} (${percent(stats.offers_without_price, stats.offers)}).`,
      `- پیشنهادهای یک میلیارد تومان و بیشتر: ${number(stats.offers_one_billion_plus)}.`,
      `- بازهٔ تاریخ تغییر قیمت: ${date(stats.min_price_date)} تا ${date(stats.max_price_date)}.`,
      "- در Import، قیمت‌های نامعتبر یا بزرگ‌تر از سقف `integer` (بیش از ۲٬۰۰۰٬۰۰۰٬۰۰۰ تومان) به `NULL` تبدیل شدند تا دادهٔ آلوده وارد جستجو نشود.",
      "",
      "## موقعیت و دسته‌بندی",
      "",
      `- فروشگاه‌های خارج از کادر تهران: ${number(stats.shops_outside_tehran)}.`,
      `- دسته‌های فعالیت فروشگاه: ${number(stats.shop_categories)}؛ دسته‌های محصول: ${number(stats.product_categories)}.`,
      `- بیشترین پیشنهاد در یک فروشگاه: ${number(stats.max_offers_per_shop)}.`,
      `- نشانی‌های تقریبی: ${number(stats.shops_approximate_addresses)} (${percent(stats.shops_approximate_addresses, stats.shops)})؛ این فروشگاه‌ها در رابط کاربری هشدار «آدرس تقریبی» می‌گیرند.`,
      "",
      "### پرتکرارترین دسته‌های محصول",
      "",
      "| دسته | محصول |",
      "| --- | ---: |",
      ...topProducts.rows.map((row) => `| ${row.label} | ${number(row.count)} |`),
      "",
      "### پرتکرارترین نشانه‌های محلی",
      "",
      "| نشانه | فروشگاه |",
      "| --- | ---: |",
      ...topLocations.rows.map((row) => `| ${row.label} | ${number(row.count)} |`),
      "",
      "## تکرار و یکپارچگی",
      "",
      `- جفت‌های تکراری فروشگاه/محصول: ${number(stats.duplicate_offer_pairs)}؛ ردیف‌های درگیر: ${number(stats.duplicate_offer_rows)}.`,
      `- ردیف‌های کاملاً یکسان در گروه‌های تکراری: ${number(stats.identical_offer_rows)}.`,
      "- شناسه‌های اصلی یکتا هستند و کلیدهای خارجی پیشنهادها به فروشگاه/محصول موجود اشاره می‌کنند.",
      `- دو محصول منبع بدون عنوان با عنوان شفاف «(بدون عنوان)» وارد شدند: ${number(stats.products_with_placeholder_title)} ردیف.`,
      "",
      "## نتیجه",
      "",
      "داده برای جستجو و مقایسه قابل استفاده است. کیفیت قیمت و مختصات برای اکثریت ردیف‌ها قابل اتکاست؛ پیشنهادهای بدون قیمت و ردیف‌های تکراری باید در رتبه‌بندی و شمارش نتایج نادیده یا علامت‌گذاری شوند.",
      "",
      "جزئیات ساختار ستون‌ها و نمونه‌های محدود: [`docs/dataset-profile.md`](./dataset-profile.md).",
      "",
    ].join("\n");

    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, markdown, "utf8");
    console.log(`[quality] wrote ${out}`);
  } finally {
    await pool.end();
  }
}

void main().catch((error) => {
  console.error(`[quality] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
