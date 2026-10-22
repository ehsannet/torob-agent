import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

export const DEFAULT_DATA_DIR = "data/raw/torob-dataset/torob-dataset";
export const DATASET_FILES = ["shops", "products", "offers"] as const;
export type DatasetFile = (typeof DATASET_FILES)[number];
export const DATASET_FILENAMES: Record<DatasetFile, string> = {
  shops: "shops.csv",
  products: "products.csv",
  offers: "offers.csv",
};

export type DatasetPaths = Record<DatasetFile, string> & {
  dir: string;
  readme: string;
};

async function isFile(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function discoverDataDirs(root: string, depth = 0): Promise<string[]> {
  if (depth > 3) return [];
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const names = new Set(entries.map((entry) => entry.name));
  if (DATASET_FILES.every((file) => names.has(DATASET_FILENAMES[file]))) {
    return [root];
  }
  const found: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "__MACOSX") continue;
    found.push(
      ...(await discoverDataDirs(path.join(root, entry.name), depth + 1)),
    );
  }
  return found;
}

export async function resolveDatasetPaths(input?: string): Promise<DatasetPaths> {
  const requested =
    input?.trim() ||
    process.env.DATA_DIR?.trim() ||
    path.resolve(process.cwd(), DEFAULT_DATA_DIR);
  const candidates = [
    requested,
    path.join(requested, "torob-dataset"),
    path.join(requested, "data/raw/torob-dataset/torob-dataset"),
    ...(await discoverDataDirs(requested)),
  ];

  for (const candidate of new Set(candidates)) {
    if (!(await isFile(path.join(candidate, DATASET_FILENAMES.shops)))) continue;
    const paths = {
      dir: candidate,
      readme: path.join(candidate, "README.txt"),
      shops: path.join(candidate, DATASET_FILENAMES.shops),
      products: path.join(candidate, DATASET_FILENAMES.products),
      offers: path.join(candidate, DATASET_FILENAMES.offers),
    };
    if (
      (await isFile(paths.products)) &&
      (await isFile(paths.offers))
    ) {
      return paths;
    }
  }

  throw new Error(
    `dataset not found at ${requested}; set DATA_DIR or pass --dir with shops.csv, products.csv and offers.csv`,
  );
}

export type DeclaredCounts = Partial<Record<DatasetFile, number>>;

export async function readDeclaredCounts(readme: string): Promise<DeclaredCounts> {
  try {
    const text = await readFile(readme, "utf8");
    const counts: DeclaredCounts = {};
    for (const line of text.split("\n")) {
      const match = /^(\w+)\.csv:\s*([\d,]+)\s+rows/.exec(line.trim());
      if (!match) continue;
      const file = match[1] as DatasetFile;
      if ((DATASET_FILES as readonly string[]).includes(file)) {
        counts[file] = Number(match[2].replaceAll(",", ""));
      }
    }
    return counts;
  } catch {
    return {};
  }
}
