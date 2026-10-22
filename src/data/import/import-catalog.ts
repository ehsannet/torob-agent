import type { Readable, Transform } from "node:stream";
import { parse } from "csv-parse";
import type { Client, Pool } from "pg";
import type { NewOffer, NewProduct, NewShop } from "../../db/schema";
import type { DatasetFile } from "./dataset";
import { mapOfferRow, mapProductRow, mapShopRow } from "./mapping";

export const MAX_IMPORT_PRICE = 2_000_000_000;
const SHOP_BATCH = 200;
const PRODUCT_BATCH = 500;
const OFFER_BATCH = 500;

export type CsvSource = {
  kind: "local" | "url" | "zip";
  label: string;
  open: (file: DatasetFile) => Promise<Readable>;
  cleanup: () => Promise<void>;
};

export type ImportSummary = {
  shops: number;
  products: number;
  offers: number;
  skippedShops: number;
  skippedProducts: number;
  skippedOffers: number;
  nullPrices: number;
  invalidPrices: number;
  warnings: string[];
};

export type ImportOptions = {
  dryRun?: boolean;
  source: CsvSource;
};

function warning(summary: ImportSummary, message: string): void {
  if (summary.warnings.length < 20) summary.warnings.push(message);
}

async function insertBatch(
  client: Client,
  table: string,
  rows: Record<string, unknown>[],
): Promise<void> {
  if (rows.length === 0) return;
  const columns = Object.keys(rows[0]);
  const values: unknown[] = [];
  const placeholders = rows.map((row) => {
    const cells = columns.map((column) => {
      values.push(row[column]);
      return `$${values.length}`;
    });
    return `(${cells.join(", ")})`;
  });
  await client.query(
    `insert into ${table} (${columns.map((column) => `"${column}"`).join(", ")}) values ${placeholders.join(", ")}`,
    values,
  );
}

function shopRecord(shop: NewShop): Record<string, unknown> {
  return {
    id: shop.id,
    name: shop.name,
    name_normalized: shop.nameNormalized,
    business_type: shop.businessType ?? null,
    activity_category: shop.activityCategory ?? null,
    description: shop.description ?? null,
    images: shop.images,
    torob_history: shop.torobHistory ?? null,
    licenses: shop.licenses,
    address_text: shop.addressText,
    address_normalized: shop.addressNormalized,
    mall_name: shop.mallName ?? null,
    floor: shop.floor ?? null,
    unit: shop.unit ?? null,
    street: shop.street ?? null,
    landmark: shop.landmark ?? null,
    location_notes: shop.locationNotes ?? null,
    address_confidence: shop.addressConfidence,
    latitude: shop.latitude ?? null,
    longitude: shop.longitude ?? null,
    weekly_hours: shop.weeklyHours ?? null,
    phone: shop.phone ?? null,
    whatsapp: shop.whatsapp ?? null,
    bale: shop.bale ?? null,
    instagram: shop.instagram ?? null,
    website: shop.website ?? null,
    accepts_torob_pay: shop.acceptsTorobPay,
    offers_installments: shop.offersInstallments,
    accepts_kalabarg: shop.acceptsKalabarg,
    has_fast_delivery: shop.hasFastDelivery,
    is_sample: shop.isSample ?? false,
  };
}

function productRecord(product: NewProduct): Record<string, unknown> {
  return {
    id: product.id,
    title_fa: product.titleFa,
    title_fa_normalized: product.titleFaNormalized,
    title_en: product.titleEn ?? null,
    brand: product.brand ?? null,
    brand_normalized: product.brandNormalized ?? null,
    category: product.category,
    specs: product.specs,
    description: product.description ?? null,
    images: product.images,
    is_sample: product.isSample ?? false,
  };
}

function offerRecord(offer: NewOffer): Record<string, unknown> {
  return {
    id: offer.id,
    shop_id: offer.shopId,
    product_id: offer.productId,
    seller_title: offer.sellerTitle ?? null,
    seller_title_normalized: offer.sellerTitleNormalized ?? null,
    seller_description: offer.sellerDescription ?? null,
    price: offer.price ?? null,
    price_unit: offer.priceUnit,
    warranty_provider: offer.warrantyProvider ?? null,
    warranty_duration_months: offer.warrantyDurationMonths ?? null,
    last_price_change_at: offer.lastPriceChangeAt ?? null,
    is_sample: offer.isSample ?? false,
  };
}

export async function importCsvCatalog(
  pool: Pool,
  options: ImportOptions,
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    shops: 0,
    products: 0,
    offers: 0,
    skippedShops: 0,
    skippedProducts: 0,
    skippedOffers: 0,
    nullPrices: 0,
    invalidPrices: 0,
    warnings: [],
  };

  const { source } = options;
  const shopIds = new Set<string>();
  const productIds = new Set<string>();

  const client = options.dryRun ? null : await pool.connect();
  try {
    if (client) {
      await client.query("begin");
      await client.query(`
        truncate table
          "seller_checks",
          "shop_observations",
          "offer_observations",
          "offers",
          "products",
          "shops"
        restart identity cascade
      `);
    }

    const shops = (await source.open("shops")).pipe(csvRows());
    let shopBatch: NewShop[] = [];
    let shopIndex = 0;
    for await (const raw of shops) {
      shopIndex += 1;
      try {
        const shop = mapShopRow(raw, shopIndex);
        shopIds.add(shop.id);
        summary.shops += 1;
        if (client) {
          shopBatch.push(shop);
          if (shopBatch.length >= SHOP_BATCH) {
            await insertBatch(client, "shops", shopBatch.map(shopRecord));
            shopBatch = [];
          }
        }
      } catch (error) {
        summary.skippedShops += 1;
        warning(summary, `shops row ${shopIndex}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (client && shopBatch.length > 0) {
      await insertBatch(client, "shops", shopBatch.map(shopRecord));
    }

    const products = (await source.open("products")).pipe(csvRows());
    let productBatch: NewProduct[] = [];
    let productIndex = 0;
    for await (const raw of products) {
      productIndex += 1;
      const rawId = typeof raw.product_id === "string" ? raw.product_id.trim() : "";
      const rawTitle = typeof raw.persian_title === "string" ? raw.persian_title.trim() : "";
      try {
        if (!rawTitle) {
          warning(summary, `products row ${productIndex}: missing title; imported a transparent placeholder`);
        }
        const product = mapProductRow(raw, productIndex, {
          allowMissingTitle: true,
        });
        productIds.add(product.id);
        summary.products += 1;
        if (client) {
          productBatch.push(product);
          if (productBatch.length >= PRODUCT_BATCH) {
            await insertBatch(client, "products", productBatch.map(productRecord));
            productBatch = [];
          }
        }
      } catch (error) {
        summary.skippedProducts += 1;
        if (rawId) productIds.delete(rawId);
        warning(summary, `products row ${productIndex}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (client && productBatch.length > 0) {
      await insertBatch(client, "products", productBatch.map(productRecord));
    }

    const offers = (await source.open("offers")).pipe(csvRows());
    let offerBatch: NewOffer[] = [];
    let offerIndex = 0;
    for await (const raw of offers) {
      offerIndex += 1;
      const rawShop = typeof raw.shop_id === "string" ? raw.shop_id.trim() : "";
      const rawProduct = typeof raw.product_id === "string" ? raw.product_id.trim() : "";
      if (!shopIds.has(rawShop) || !productIds.has(rawProduct)) {
        summary.skippedOffers += 1;
        warning(summary, `offers row ${offerIndex}: missing shop or product reference`);
        continue;
      }
      try {
        const offer = mapOfferRow(raw, offerIndex);
        const price = offer.price ?? null;
        if (price === null) {
          summary.nullPrices += 1;
        } else if (price <= 0 || price > MAX_IMPORT_PRICE) {
          summary.invalidPrices += 1;
          offer.price = null;
        }
        summary.offers += 1;
        if (client) {
          offerBatch.push(offer);
          if (offerBatch.length >= OFFER_BATCH) {
            await insertBatch(client, "offers", offerBatch.map(offerRecord));
            offerBatch = [];
          }
        }
      } catch (error) {
        summary.skippedOffers += 1;
        warning(summary, `offers row ${offerIndex}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (client && offerBatch.length > 0) {
      await insertBatch(client, "offers", offerBatch.map(offerRecord));
    }

    if (client) {
      const counts = await client.query<{
        shops: number;
        products: number;
        offers: number;
      }>(`
        select
          (select count(*)::int from shops) as shops,
          (select count(*)::int from products) as products,
          (select count(*)::int from offers) as offers
      `);
      const row = counts.rows[0];
      if (
        !row ||
        row.shops !== summary.shops ||
        row.products !== summary.products ||
        row.offers !== summary.offers
      ) {
        throw new Error(
          `import verification failed: expected ${summary.shops}/${summary.products}/${summary.offers}, got ${row?.shops}/${row?.products}/${row?.offers}`,
        );
      }
      await client.query("commit");
    }
  } catch (error) {
    if (client) await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client?.release();
    await source.cleanup();
  }

  return summary;
}

function csvRows(): Transform {
  return parse({
    bom: true,
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });
}
