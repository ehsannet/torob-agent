import { Pool } from "pg";
import { extractAddressesWithLlm } from "../src/data/address/llm";
import {
  isApproximateAddress,
  mergeAddressFields,
  type AddressFields,
} from "../src/lib/address";

type ShopRow = {
  id: string;
  address_text: string;
  mall_name: string | null;
  floor: string | null;
  unit: string | null;
  street: string | null;
  landmark: string | null;
  address_confidence: number;
  latitude: number | null;
  longitude: number | null;
};

type AddressUpdate = ShopRow & {
  fields: AddressFields;
};

function readNumberOption(args: string[], name: string): number | undefined {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const value = Number(args[index + 1]);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

function sameValue(a: string | null, b: string | null): boolean {
  return (a ?? "") === (b ?? "");
}

function mergeForRow(row: ShopRow): AddressFields {
  return mergeAddressFields({
    addressText: row.address_text,
    mallName: row.mall_name,
    floor: row.floor,
    unit: row.unit,
    street: row.street,
    landmark: row.landmark,
    latitude: row.latitude,
    longitude: row.longitude,
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const useLlm = args.includes("--llm");
  const limit = readNumberOption(args, "--limit");
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({
    connectionString,
    max: 1,
    application_name: "torob-address-backfill",
  });

  try {
    const result = await pool.query<ShopRow>(
      `select id, address_text, mall_name, floor, unit, street, landmark,
              address_confidence, latitude, longitude
       from shops
       order by id
       ${limit ? "limit $1" : ""}`,
      limit ? [limit] : [],
    );

    const updates: AddressUpdate[] = result.rows.map((row) => ({
      ...row,
      fields: mergeForRow(row),
    }));

    let llmStats = { fromCache: 0, fromModel: 0, failed: 0, candidates: 0 };
    if (useLlm) {
      const candidates = updates
        .filter(
          (row) =>
            !row.fields.mallName &&
            !row.fields.floor &&
            !row.fields.unit &&
            row.address_text.trim() !== "آدرس نامشخص",
        )
        .map((row) => ({ id: row.id, addressText: row.address_text }));
      llmStats.candidates = candidates.length;
      const extracted = await extractAddressesWithLlm(candidates);
      llmStats = {
        ...llmStats,
        fromCache: extracted.fromCache,
        fromModel: extracted.fromModel,
        failed: extracted.failed,
      };
      for (const row of updates) {
        const suggestion = extracted.fields.get(row.id);
        if (!suggestion) continue;
        row.fields = mergeAddressFields({
          addressText: row.address_text,
          mallName: row.fields.mallName ?? suggestion.mallName,
          floor: row.fields.floor ?? suggestion.floor,
          unit: row.fields.unit ?? suggestion.unit,
          street: row.fields.street ?? suggestion.street,
          landmark: row.fields.landmark ?? suggestion.landmark,
          latitude: row.latitude,
          longitude: row.longitude,
        });
      }
    }

    const stats = {
      shops: updates.length,
      changed: 0,
      approximate: 0,
      mall: 0,
      floor: 0,
      unit: 0,
      street: 0,
    };
    const changed: AddressUpdate[] = [];

    for (const row of updates) {
      const fields = row.fields;
      if (fields.mallName) stats.mall += 1;
      if (fields.floor) stats.floor += 1;
      if (fields.unit) stats.unit += 1;
      if (fields.street) stats.street += 1;
      if (isApproximateAddress(fields.addressConfidence)) stats.approximate += 1;

      if (
        !sameValue(fields.mallName, row.mall_name) ||
        !sameValue(fields.floor, row.floor) ||
        !sameValue(fields.unit, row.unit) ||
        !sameValue(fields.street, row.street) ||
        fields.addressConfidence !== row.address_confidence
      ) {
        stats.changed += 1;
        changed.push(row);
      }
    }

    if (apply && changed.length > 0) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        for (const row of changed) {
          await client.query(
            `update shops
             set mall_name = $2, floor = $3, unit = $4, street = $5,
                 address_confidence = $6, updated_at = now()
             where id = $1`,
            [
              row.id,
              row.fields.mallName,
              row.fields.floor,
              row.fields.unit,
              row.fields.street,
              row.fields.addressConfidence,
            ],
          );
        }
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    }

    console.log(
      `[addresses] shops=${stats.shops} changed=${stats.changed} applied=${apply}`,
    );
    console.log(
      `[addresses] filled mall=${stats.mall} floor=${stats.floor} unit=${stats.unit} street=${stats.street}`,
    );
    console.log(
      `[addresses] approximate=${stats.approximate} (${Math.round((stats.approximate / Math.max(stats.shops, 1)) * 1000) / 10}%)`,
    );
    if (useLlm) {
      console.log(
        `[addresses] llm candidates=${llmStats.candidates} cache=${llmStats.fromCache} model=${llmStats.fromModel} failed=${llmStats.failed}`,
      );
    }
  } finally {
    await pool.end();
  }
}

void main().catch((error) => {
  console.error(
    `[addresses] failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
