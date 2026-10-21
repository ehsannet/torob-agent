import { generateSampleDataset } from "../data/sample/generate";
import { closeDb } from "../lib/db";
import { isCatalogEmpty, replaceCatalogData } from "./replace";

type SeedMode = "reset" | "if-empty";

function readMode(args: string[]): SeedMode {
  const hasReset = args.includes("--reset");
  const hasIfEmpty = args.includes("--if-empty");
  if (hasReset && hasIfEmpty) {
    throw new Error("use either --reset or --if-empty, not both");
  }
  return hasReset ? "reset" : "if-empty";
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is not set");
  }

  const mode = readMode(process.argv.slice(2));

  if (mode === "if-empty" && !(await isCatalogEmpty())) {
    console.log("[seed] catalog is not empty; skipping");
    return;
  }

  const startedAt = Date.now();
  console.log(`[seed] mode=${mode} generating sample catalog...`);
  const dataset = generateSampleDataset();

  console.log(
    `[seed] generated ${dataset.shops.length} shops, ${dataset.products.length} products, ${dataset.offers.length} offers`,
  );

  await replaceCatalogData(dataset);
  console.log(
    `[seed] replaced catalog in ${Date.now() - startedAt}ms (all rows are sample data)`,
  );
}

void main()
  .catch((error) => {
    console.error(
      `[seed] failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  })
  .finally(() => closeDb());
