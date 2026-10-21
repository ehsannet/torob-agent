import type { NewOffer, NewShop } from "../../db/schema";
import { CATEGORIES, type CategoryCatalog } from "./catalog";
import { DAY_MS, EXPECTED_OFFERS, WARRANTIES } from "./constants";
import type { ProductBuild } from "./products";
import { chance, pick, randInt, roundTo, shuffle, type Rng } from "./random";

export function buildOffers(
  rng: Rng,
  shops: NewShop[],
  build: ProductBuild,
): NewOffer[] {
  const offers: NewOffer[] = [];
  const productById = new Map(build.products.map((product) => [product.id, product]));
  const now = Date.now();
  let offerIndex = 1;

  for (const [shopIndex, shop] of shops.entries()) {
    const focus = CATEGORIES[shopIndex % CATEGORIES.length] as CategoryCatalog;
    const offerCount = shopIndex < 100 ? 14 : 13;
    const focusCount = offerCount - 2;
    const selected = new Set<string>();

    const focusPool = build.productPools.get(focus.key) ?? [];
    for (const productId of shuffle(rng, focusPool).slice(0, focusCount)) {
      selected.add(productId);
    }

    const otherCategories = shuffle(
      rng,
      CATEGORIES.filter((category) => category.key !== focus.key),
    ).slice(0, 2);

    for (const category of otherCategories) {
      const pool = build.productPools.get(category.key) ?? [];
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const productId = pick(rng, pool);
        if (!selected.has(productId)) {
          selected.add(productId);
          break;
        }
      }
    }

    for (
      let attempt = 0;
      selected.size < offerCount && attempt < 100;
      attempt += 1
    ) {
      const category = pick(rng, CATEGORIES);
      const pool = build.productPools.get(category.key) ?? [];
      selected.add(pick(rng, pool));
    }

    if (selected.size !== offerCount) {
      throw new Error(`offer selection failed for ${shop.id}`);
    }

    const shopPriceFactor = 0.88 + rng() * 0.3;

    for (const productId of selected) {
      const product = productById.get(productId);
      const basePrice = build.basePrices.get(productId);
      if (!product || basePrice === undefined) {
        throw new Error(`missing product data for ${productId}`);
      }

      const price = chance(rng, 0.03)
        ? null
        : roundTo(basePrice * shopPriceFactor, 10_000);

      let lastPriceChangeAt: Date | null = null;
      if (!chance(rng, 0.05)) {
        const stale = chance(rng, 0.38);
        const daysAgo = stale ? randInt(rng, 15, 60) : randInt(rng, 0, 13);
        lastPriceChangeAt = new Date(
          now - daysAgo * DAY_MS - randInt(rng, 0, DAY_MS),
        );
      }

      const hasWarranty = chance(rng, 0.65);

      offers.push({
        id: `offer-${String(offerIndex).padStart(5, "0")}`,
        shopId: shop.id,
        productId,
        sellerTitle: product.titleFa,
        sellerTitleNormalized: product.titleFaNormalized,
        sellerDescription: chance(rng, 0.2)
          ? "ارسال از فروشگاه؛ موجودی را با فروشنده هماهنگ کنید."
          : null,
        price,
        priceUnit: "TOMAN",
        warrantyProvider: hasWarranty ? pick(rng, WARRANTIES) : null,
        warrantyDurationMonths: hasWarranty ? pick(rng, [12, 18, 24]) : null,
        lastPriceChangeAt,
        isSample: true,
      });

      offerIndex += 1;
    }
  }

  if (offers.length !== EXPECTED_OFFERS) {
    throw new Error(`expected ${EXPECTED_OFFERS} offers, got ${offers.length}`);
  }

  return offers;
}
