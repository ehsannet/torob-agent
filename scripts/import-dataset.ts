import { Pool } from "pg";
import { createCsvSource } from "../src/data/import/source";
import { importCsvCatalog } from "../src/data/import/import-catalog";

function readOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const dirOption = readOption(args, "--dir");
  const urlOption = readOption(args, "--url");
  const positional = args.find(
    (arg, index) =>
      !arg.startsWith("--") && args[index - 1] !== "--dir" && args[index - 1] !== "--url",
  );
  const dir = dirOption ?? positional;
  const url = urlOption;
  let pool: Pool | null = null;
  if (!dryRun) {
    const connectionString = process.env.DATABASE_URL?.trim();
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    pool = new Pool({
      connectionString,
      max: 1,
      connectionTimeoutMillis: 10_000,
      application_name: "torob-catalog-import",
    });
  }

  const source = await createCsvSource({ dir, url });
  console.log(`[import] source: ${source.kind} (${source.label})`);
  if (dryRun) console.log("[import] dry run; database will not be changed");

  try {
    if (!pool) {
      const dryPool = new Pool();
      try {
        const summary = await importCsvCatalog(dryPool, {
          dryRun: true,
          source,
        });
        printSummary(summary);
      } finally {
        await dryPool.end();
      }
      return;
    }

    const summary = await importCsvCatalog(pool, { source });
    printSummary(summary);
    console.log("[import] catalog replaced and verified");
  } finally {
    await pool?.end();
  }
}

function printSummary(summary: Awaited<ReturnType<typeof importCsvCatalog>>): void {
  console.log(
    `[import] shops=${summary.shops} products=${summary.products} offers=${summary.offers}`,
  );
  console.log(
    `[import] skipped shops=${summary.skippedShops} products=${summary.skippedProducts} offers=${summary.skippedOffers}`,
  );
  console.log(
    `[import] prices: null=${summary.nullPrices} invalid=${summary.invalidPrices}`,
  );
  for (const message of summary.warnings) console.warn(`[import] ${message}`);
}

void main().catch((error) => {
  console.error(
    `[import] failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
