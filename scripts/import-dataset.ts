import { readFile } from "node:fs/promises";
import path from "node:path";
import { mapRawCatalog } from "../src/data/import/mapping";
import { closeDb } from "../src/lib/db";
import { replaceCatalogData } from "../src/db/replace";

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is not set");
  }

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const file = args.find((arg) => !arg.startsWith("--"));

  if (!file) {
    throw new Error("usage: npm run db:import -- <dataset.json> [--dry-run]");
  }

  const absolutePath = path.resolve(process.cwd(), file);
  const raw = JSON.parse(await readFile(absolutePath, "utf8")) as unknown;
  const catalog = mapRawCatalog(raw);

  console.log(
    `[import] validated ${catalog.shops.length} shops, ${catalog.products.length} products, ${catalog.offers.length} offers`,
  );

  if (dryRun) {
    console.log("[import] dry run; database was not changed");
    return;
  }

  await replaceCatalogData(catalog);
  console.log(`[import] replaced catalog from ${absolutePath}`);
}

void main()
  .catch((error) => {
    console.error(
      `[import] failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  })
  .finally(() => closeDb());
