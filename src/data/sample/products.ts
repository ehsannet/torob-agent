import { normalizePersian } from "../../lib/persian";
import type { NewProduct } from "../../db/schema";
import { CATEGORIES } from "./catalog";
import { PRODUCTS_PER_CATEGORY } from "./constants";
import { pick, roundTo, shuffle, type Rng } from "./random";

export type ProductBuild = {
  products: NewProduct[];
  basePrices: Map<string, number>;
  productPools: Map<string, string[]>;
};

export function buildProducts(rng: Rng): ProductBuild {
  const products: NewProduct[] = [];
  const basePrices = new Map<string, number>();
  const productPools = new Map<string, string[]>();
  let productIndex = 1;

  for (const category of CATEGORIES) {
    const combinations = category.brands.flatMap((brand) =>
      brand.models.flatMap((model) =>
        category.variants.map((variant) => ({ brand, model, variant })),
      ),
    );

    if (combinations.length < PRODUCTS_PER_CATEGORY) {
      throw new Error(`not enough combinations for category ${category.key}`);
    }

    const selected = shuffle(rng, combinations).slice(0, PRODUCTS_PER_CATEGORY);
    const pool: string[] = [];

    for (const combination of selected) {
      const id = `product-${String(productIndex).padStart(5, "0")}`;
      const titleFa = `${category.prefix} ${combination.brand.brandFa} ${combination.model} ${combination.variant}`;
      const specs: Record<string, string> = {
        [category.variantSpecKey]: combination.variant,
      };
      for (const [key, options] of Object.entries(category.specOptions)) {
        if (key === category.variantSpecKey) continue;
        specs[key] = pick(rng, options);
      }

      const [minPrice, maxPrice] = category.priceRange;
      const basePrice = roundTo(
        (minPrice + rng() * (maxPrice - minPrice)) *
          combination.brand.priceFactor,
        10_000,
      );

      products.push({
        id,
        titleFa,
        titleFaNormalized: normalizePersian(titleFa),
        titleEn: `${combination.brand.brand} ${combination.model}`,
        brand: combination.brand.brand,
        brandNormalized: normalizePersian(combination.brand.brand),
        category: category.labelFa,
        specs,
        description: `محصول نمونه در دسته ${category.labelFa} برای آزمون جست‌وجو و مقایسه قیمت.`,
        images: [],
        isSample: true,
      });

      basePrices.set(id, basePrice);
      pool.push(id);
      productIndex += 1;
    }

    productPools.set(category.key, pool);
  }

  return { products, basePrices, productPools };
}
