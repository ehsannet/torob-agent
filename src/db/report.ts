import { closeDb, getPool } from "../lib/db";

type ReportRow = {
  shops: number;
  products: number;
  offers: number;
  shops_without_hours: number;
  shops_without_coords: number;
  low_confidence_shops: number;
  offers_without_price: number;
  offers_without_price_date: number;
  stale_offers: number;
  offers_in_rial: number;
  offer_observations: number;
  shop_observations: number;
  seller_checks: number;
  shop_categories: number;
  product_categories: number;
  min_offers_per_shop: number;
  max_offers_per_shop: number;
  avg_offers_per_shop: number;
  sample_shops: number;
  sample_products: number;
  sample_offers: number;
};

function percent(part: number, total: number): string {
  if (total === 0) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is not set");
  }

  const { rows } = await getPool().query<ReportRow>(`
    select
      (select count(*)::int from shops) as shops,
      (select count(*)::int from products) as products,
      (select count(*)::int from offers) as offers,
      (select count(*)::int from shops where weekly_hours is null) as shops_without_hours,
      (select count(*)::int from shops where latitude is null or longitude is null) as shops_without_coords,
      (select count(*)::int from shops where address_confidence < 0.5) as low_confidence_shops,
      (select count(*)::int from offers where price is null) as offers_without_price,
      (select count(*)::int from offers where last_price_change_at is null) as offers_without_price_date,
      (select count(*)::int from offers where last_price_change_at < now() - interval '14 days') as stale_offers,
      (select count(*)::int from offers where price_unit = 'RIAL') as offers_in_rial,
      (select count(*)::int from offer_observations) as offer_observations,
      (select count(*)::int from shop_observations) as shop_observations,
      (select count(*)::int from seller_checks) as seller_checks,
      (select count(distinct activity_category)::int from shops) as shop_categories,
      (select count(distinct category)::int from products) as product_categories,
      (select coalesce(min(c), 0)::int from (select count(*) c from offers group by shop_id) s) as min_offers_per_shop,
      (select coalesce(max(c), 0)::int from (select count(*) c from offers group by shop_id) s) as max_offers_per_shop,
      (select coalesce(round(avg(c), 2), 0)::float from (select count(*) c from offers group by shop_id) s) as avg_offers_per_shop,
      (select count(*)::int from shops where is_sample) as sample_shops,
      (select count(*)::int from products where is_sample) as sample_products,
      (select count(*)::int from offers where is_sample) as sample_offers
  `);

  const report = rows[0];
  if (!report) throw new Error("report query returned no rows");

  console.log("[report] catalog");
  console.log(
    `  shops=${report.shops} products=${report.products} offers=${report.offers}`,
  );
  console.log(
    `  sample rows: shops=${report.sample_shops} products=${report.sample_products} offers=${report.sample_offers}`,
  );
  console.log(
    `  categories: shops=${report.shop_categories} products=${report.product_categories}`,
  );
  console.log(
    `  offers per shop: min=${report.min_offers_per_shop} avg=${report.avg_offers_per_shop} max=${report.max_offers_per_shop}`,
  );
  console.log("[report] gaps");
  console.log(
    `  shops without hours: ${report.shops_without_hours} (${percent(report.shops_without_hours, report.shops)})`,
  );
  console.log(
    `  shops without coordinates: ${report.shops_without_coords} (${percent(report.shops_without_coords, report.shops)})`,
  );
  console.log(
    `  low-confidence addresses: ${report.low_confidence_shops} (${percent(report.low_confidence_shops, report.shops)})`,
  );
  console.log(
    `  offers without price: ${report.offers_without_price} (${percent(report.offers_without_price, report.offers)})`,
  );
  console.log(
    `  offers without price date: ${report.offers_without_price_date} (${percent(report.offers_without_price_date, report.offers)})`,
  );
  console.log(
    `  stale offers (>14 days): ${report.stale_offers} (${percent(report.stale_offers, report.offers)})`,
  );
  console.log(`  offers priced in RIAL: ${report.offers_in_rial}`);
  console.log(
    `  observations: offers=${report.offer_observations} shops=${report.shop_observations} seller_checks=${report.seller_checks}`,
  );

  if (report.shops === 0) {
    console.log("[report] catalog is empty; run npm run db:migrate && npm run import");
  }
}

void main()
  .catch((error) => {
    console.error(
      `[report] failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  })
  .finally(() => closeDb());
