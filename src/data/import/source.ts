import { createReadStream } from "node:fs";
import { createWriteStream } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";
import { pipeline } from "node:stream/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  DATASET_FILENAMES,
  resolveDatasetPaths,
} from "./dataset";
import type { CsvSource } from "./import-catalog";

const execFileAsync = promisify(execFile);

function fromWeb(body: ReadableStream<Uint8Array>): Readable {
  return Readable.fromWeb(body as unknown as NodeWebReadableStream<Uint8Array>);
}

function localSource(dir: string): CsvSource {
  return {
    kind: "local",
    label: path.relative(process.cwd(), dir) || dir,
    open: async (file) => createReadStream(path.join(dir, DATASET_FILENAMES[file])),
    cleanup: async () => undefined,
  };
}

function urlSource(base: string): CsvSource {
  const normalized = base.endsWith("/") ? base : `${base}/`;
  return {
    kind: "url",
    label: base,
    open: async (file) => {
      const url = new URL(DATASET_FILENAMES[file], normalized);
      const response = await fetch(url);
      if (!response.ok || !response.body) {
        throw new Error(`download failed for ${url.toString()}: HTTP ${response.status}`);
      }
      return fromWeb(response.body);
    },
    cleanup: async () => undefined,
  };
}

async function downloadFile(url: string, destination: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`download failed for ${url}: HTTP ${response.status}`);
  }
  const total = Number(response.headers.get("content-length") ?? "0");
  console.log(
    `[import] downloading ${total > 0 ? `${(total / 1024 / 1024).toFixed(0)} MB` : "dataset"}`,
  );
  await pipeline(fromWeb(response.body), createWriteStream(destination));
}

async function zipSource(url: string): Promise<CsvSource> {
  const dir = await mkdtemp(path.join(tmpdir(), "torob-import-"));
  const archive = path.join(dir, "dataset.zip");
  const extracted = path.join(dir, "extracted");
  try {
    await downloadFile(url, archive);
    console.log("[import] extracting archive");
    await execFileAsync("unzip", ["-q", archive, "-d", extracted]);
    const paths = await resolveDatasetPaths(extracted);
    console.log(`[import] extracted data in ${paths.dir}`);
    return {
      kind: "zip",
      label: url,
      open: async (file) => createReadStream(paths[file]),
      cleanup: async () => {
        await rm(dir, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
}

export async function createCsvSource(options: {
  dir?: string;
  url?: string;
}): Promise<CsvSource> {
  const dir = options.dir?.trim() || process.env.DATA_DIR?.trim();
  const url = options.url?.trim() || process.env.IMPORT_URL?.trim();

  if (dir) {
    const paths = await resolveDatasetPaths(dir);
    return localSource(paths.dir);
  }

  if (!url) {
    const paths = await resolveDatasetPaths();
    return localSource(paths.dir);
  }

  if (new URL(url).pathname.toLowerCase().endsWith(".zip")) {
    return zipSource(url);
  }

  return urlSource(url);
}
