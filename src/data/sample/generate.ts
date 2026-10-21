import type { CatalogData } from "../../db/replace";
import { SEED } from "./constants";
import { buildOffers } from "./offers";
import { buildProducts } from "./products";
import { createRng } from "./random";
import { buildShops } from "./shops";

export function generateSampleDataset(seed = SEED): CatalogData {
  const rng = createRng(seed);
  const shops = buildShops(rng);
  const build = buildProducts(rng);
  const offers = buildOffers(rng, shops, build);

  return { shops, products: build.products, offers };
}
