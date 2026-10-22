import { createReadStream } from "node:fs";
import { stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse";
import {
  DATASET_FILENAMES,
  DATASET_FILES,
  readDeclaredCounts,
  resolveDatasetPaths,
  type DatasetFile,
} from "../src/data/import/dataset";

type ColumnProfile = {
  nonEmpty: number;
  jsonValid: number;
  jsonInvalid: number;
  numbers: number;
  dates: number;
  booleans: number;
  maxLength: number;
  samples: string[];
  unique: Set<string>;
  uniqueCapped: boolean;
};

type FileProfile = {
  file: DatasetFile;
  bytes: number;
  rows: number;
  columns: string[];
  columnProfiles: Map<string, ColumnProfile>;
};

const SAMPLE_LIMIT = 2;
const UNIQUE_LIMIT = 1000;

function emptyProfile(): ColumnProfile {
  return {
    nonEmpty: 0,
    jsonValid: 0,
    jsonInvalid: 0,
    numbers: 0,
    dates: 0,
    booleans: 0,
    maxLength: 0,
    samples: [],
    unique: new Set(),
    uniqueCapped: false,
  };
}

function isNullish(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === "" || trimmed.toLowerCase() === "null";
}

function looksJson(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("[") || trimmed.startsWith("{");
}

function looksNumber(value: string): boolean {
  return /^-?\d+(?:\.\d+)?$/.test(value.trim());
}

function looksDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(?:[T\s][\d:.+-]+Z?)?$/.test(value.trim());
}

function observe(profile: ColumnProfile, raw: string): void {
  if (isNullish(raw)) return;
  const value = raw.trim();
  profile.nonEmpty += 1;
  profile.maxLength = Math.max(profile.maxLength, value.length);

  if (profile.samples.length < SAMPLE_LIMIT) {
    profile.samples.push(value.length > 80 ? `${value.slice(0, 77)}...` : value);
  }

  if (!profile.uniqueCapped) {
    profile.unique.add(value);
    if (profile.unique.size >= UNIQUE_LIMIT) profile.uniqueCapped = true;
  }

  if (looksNumber(value)) profile.numbers += 1;
  if (looksDate(value)) profile.dates += 1;
  if (/^(true|false|yes|no|0|1)$/i.test(value)) profile.booleans += 1;

  if (looksJson(value)) {
    try {
      JSON.parse(value);
      profile.jsonValid += 1;
    } catch {
      profile.jsonInvalid += 1;
    }
  }
}

function inferType(profile: ColumnProfile): string {
  if (profile.nonEmpty === 0) return "empty";
  const threshold = profile.nonEmpty * 0.5;
  if (profile.jsonValid + profile.jsonInvalid > threshold) {
    return profile.jsonInvalid > 0 ? "json (mixed/invalid)" : "json";
  }
  if (profile.numbers > threshold) return "number";
  if (profile.dates > threshold) return "date";
  if (profile.booleans > threshold) return "boolean";
  return "text";
}

function percent(part: number, total: number): string {
  if (total === 0) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function escapeCell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

async function profileFile(
  file: DatasetFile,
  filePath: string,
): Promise<FileProfile> {
  const info = await stat(filePath);
  const parser = createReadStream(filePath).pipe(
    parse({
      bom: true,
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    }),
  );

  let columns: string[] = [];
  let rows = 0;
  const columnProfiles = new Map<string, ColumnProfile>();

  for await (const raw of parser) {
    const row = raw as Record<string, string>;
    if (columns.length === 0) {
      columns = Object.keys(row);
      for (const column of columns) columnProfiles.set(column, emptyProfile());
    }
    rows += 1;
    for (const column of columns) {
      const profile = columnProfiles.get(column);
      if (profile) observe(profile, row[column] ?? "");
    }
  }

  return { file, bytes: info.size, rows, columns, columnProfiles };
}

function renderFile(profile: FileProfile, declared?: number): string {
  const lines = [
    `## ${DATASET_FILENAMES[profile.file]}`,
    "",
    `- Size: ${(profile.bytes / 1024 / 1024).toFixed(1)} MB`,
    `- Rows: ${profile.rows.toLocaleString("en-US")}${declared !== undefined ? ` (README: ${declared.toLocaleString("en-US")})` : ""}`,
    `- Columns: ${profile.columns.length}`,
    "",
    "| Column | Type | Empty | Unique | Max length | Sample values |",
    "| --- | --- | ---: | ---: | ---: | --- |",
  ];

  for (const column of profile.columns) {
    const item = profile.columnProfiles.get(column);
    if (!item) continue;
    const unique = item.uniqueCapped ? `>${UNIQUE_LIMIT - 1}` : String(item.unique.size);
    const samples = item.samples.map((value) => `\`${escapeCell(value)}\``).join(", ");
    lines.push(
      `| \`${column}\` | ${inferType(item)} | ${percent(profile.rows - item.nonEmpty, profile.rows)} | ${unique} | ${item.maxLength} | ${samples || "—"} |`,
    );
  }

  lines.push("");
  return lines.join("\n");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dirArgIndex = args.indexOf("--dir");
  const dirArg = dirArgIndex >= 0 ? args[dirArgIndex + 1] : args.find((arg) => !arg.startsWith("--"));
  const paths = await resolveDatasetPaths(dirArg);
  const declared = await readDeclaredCounts(paths.readme);
  const profiles: FileProfile[] = [];

  for (const file of DATASET_FILES) {
    const profile = await profileFile(file, paths[file]);
    profiles.push(profile);
    console.log(`[profile] ${file}: ${profile.rows} rows, ${profile.columns.length} columns`);
  }

  const lines = [
    "# Dataset profile",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Source: \`${path.relative(process.cwd(), paths.dir)}\``,
    "",
    "This file is generated by `npm run data:profile`. Values are truncated samples only; the full dataset is not copied into the repository.",
    "",
    ...profiles.map((profile) => renderFile(profile, declared[profile.file])),
    "## Interpretation notes",
    "",
    "- Empty includes empty strings and the literal `null` used by the export.",
    "- JSON columns are counted as valid or invalid JSON; arrays of objects are kept as JSON.",
    "- Unique is capped at 1,000 values per column to keep profiling memory bounded.",
    "",
  ];

  const output = path.resolve(process.cwd(), "docs/dataset-profile.md");
  await writeFile(output, lines.join("\n"), "utf8");
  console.log(`[profile] wrote ${path.relative(process.cwd(), output)}`);
}

void main().catch((error) => {
  console.error(`[profile] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
