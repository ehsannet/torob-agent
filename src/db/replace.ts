import { count, sql } from "drizzle-orm";
import { getDb } from "../lib/db";
import { offers, products, shops } from "./schema";
import type { NewOffer, NewProduct, NewShop } from "./schema";

export type CatalogData = {
  shops: NewShop[];
  products: NewProduct[];
  offers: NewOffer[];
};

export async function isCatalogEmpty(): Promise<boolean> {
  const [row] = await getDb().select({ value: count() }).from(shops);
  return (row?.value ?? 0) === 0;
}

export async function replaceCatalogData(data: CatalogData): Promise<void> {
  const db = getDb();

  await db.transaction(async (tx) => {
    await tx.execute(sql`
      truncate table
        "seller_checks",
        "shop_observations",
        "offer_observations",
        "offers",
        "products",
        "shops"
      restart identity cascade
    `);

    for (let index = 0; index < data.shops.length; index += 200) {
      await tx.insert(shops).values(data.shops.slice(index, index + 200));
    }
    for (let index = 0; index < data.products.length; index += 500) {
      await tx.insert(products).values(data.products.slice(index, index + 500));
    }
    for (let index = 0; index < data.offers.length; index += 500) {
      await tx.insert(offers).values(data.offers.slice(index, index + 500));
    }
  });
}
