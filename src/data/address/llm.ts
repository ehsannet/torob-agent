import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateText } from "ai";
import { z } from "zod";
import {
  AGENT_PROVIDER_NAME,
  getAgentConfig,
  getAgentModel,
} from "../../agent/config";
import { normalizePersian } from "../../lib/persian";

const BATCH_SIZE = 6;

const suggestionSchema = z.object({
  id: z.string(),
  mallName: z.string().nullable().optional(),
  floor: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  landmark: z.string().nullable().optional(),
});

const responseSchema = z.object({
  items: z.array(suggestionSchema),
});

export type LlmAddressFields = {
  mallName: string | null;
  floor: string | null;
  unit: string | null;
  street: string | null;
  landmark: string | null;
};

export type AddressCandidate = {
  id: string;
  addressText: string;
};

type CacheEntry = {
  fields: LlmAddressFields;
  model: string;
  updatedAt: string;
};

type CacheFile = Record<string, CacheEntry>;

export type LlmExtractionResult = {
  fields: Map<string, LlmAddressFields>;
  fromCache: number;
  fromModel: number;
  failed: number;
};

function cacheKey(model: string, addressText: string): string {
  return createHash("sha256")
    .update(`${model}|${normalizePersian(addressText)}`)
    .digest("hex");
}

async function loadCache(filePath: string): Promise<CacheFile> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as CacheFile;
  } catch {
    return {};
  }
}

async function saveCache(filePath: string, cache: CacheFile): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
}

function cleanField(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned === "null" || cleaned === "نامشخص") return null;
  return cleaned;
}

function appearsInAddress(addressText: string, value: string | null): boolean {
  if (!value) return false;
  const address = normalizePersian(addressText).replace(/\s+/g, "");
  const normalized = normalizePersian(value).replace(/\s+/g, "");
  if (normalized.length < 2) return false;
  if (address.includes(normalized)) return true;
  return normalizePersian(value)
    .split(" ")
    .filter((token) => token.length >= 2)
    .some((token) => address.includes(token.replace(/\s+/g, "")));
}

function validatedFields(
  candidate: AddressCandidate,
  suggestion: z.infer<typeof suggestionSchema>,
): LlmAddressFields {
  const mallName = cleanField(suggestion.mallName);
  const floor = cleanField(suggestion.floor);
  const unit = cleanField(suggestion.unit);
  const street = cleanField(suggestion.street);
  const landmark = cleanField(suggestion.landmark);

  return {
    mallName:
      mallName && appearsInAddress(candidate.addressText, mallName)
        ? mallName
        : null,
    floor:
      floor && appearsInAddress(candidate.addressText, floor) ? floor : null,
    unit: unit && appearsInAddress(candidate.addressText, unit) ? unit : null,
    street:
      street && appearsInAddress(candidate.addressText, street)
        ? street
        : null,
    landmark:
      landmark && appearsInAddress(candidate.addressText, landmark)
        ? landmark
        : null,
  };
}

function parseResponse(text: string): z.infer<typeof responseSchema> | null {
  const cleaned = text
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return responseSchema.parse(JSON.parse(cleaned.slice(start, end + 1)));
  } catch {
    return null;
  }
}

function batchPrompt(candidates: AddressCandidate[]): string {
  return `این نشانی‌های فارسی را به فیلدهای ساختاریافته تبدیل کن.
فقط اطلاعاتی را استخراج کن که در متن نشانی آمده است. چیزی از خودت نساز.
اگر فیلدی در متن نیست، null بگذار.
خروجی فقط یک JSON با شکل {"items":[{"id":"...","mallName":null,"floor":null,"unit":null,"street":null,"landmark":null}]} باشد.
شناسه‌ها را دقیقاً همان‌طور که آمده برگردان.

${JSON.stringify(candidates)}`;
}

async function callModel(
  candidates: AddressCandidate[],
): Promise<Map<string, LlmAddressFields>> {
  const model = getAgentModel();
  if (!model) throw new Error("LLM is not configured");
  const config = getAgentConfig();
  const result = await generateText({
    model,
    system:
      "تو یک استخراج‌کنندهٔ دقیق نشانی فارسی هستی. فقط JSON معتبر برمی‌گردانی و هیچ فیلدی را حدس نمی‌زنی.",
    prompt: batchPrompt(candidates),
    maxOutputTokens: Math.max(900, config.maxOutputTokens * 2),
    maxRetries: 1,
    providerOptions: {
      [AGENT_PROVIDER_NAME]: { reasoningEffort: "none" },
    },
  });
  const parsed = parseResponse(result.text);
  if (!parsed) return new Map();

  const byId = new Map<string, LlmAddressFields>();
  const allowed = new Set(candidates.map((candidate) => candidate.id));
  for (const item of parsed.items) {
    if (!allowed.has(item.id)) continue;
    const candidate = candidates.find((entry) => entry.id === item.id);
    if (!candidate) continue;
    byId.set(item.id, validatedFields(candidate, item));
  }
  return byId;
}

export async function extractAddressesWithLlm(
  candidates: AddressCandidate[],
  cachePath = ".cache/address-extractions.json",
): Promise<LlmExtractionResult> {
  const config = getAgentConfig();
  if (!config.configured) {
    throw new Error("LLM_BASE_URL/LLM_API_KEY are not configured");
  }

  const cache = await loadCache(cachePath);
  const fields = new Map<string, LlmAddressFields>();
  const misses: AddressCandidate[] = [];
  let fromCache = 0;

  for (const candidate of candidates) {
    const key = cacheKey(config.modelId, candidate.addressText);
    const cached = cache[key];
    if (cached) {
      fields.set(candidate.id, cached.fields);
      fromCache += 1;
    } else {
      misses.push(candidate);
    }
  }

  let fromModel = 0;
  let failed = 0;
  for (let index = 0; index < misses.length; index += BATCH_SIZE) {
    const batch = misses.slice(index, index + BATCH_SIZE);
    try {
      const extracted = await callModel(batch);
      if (extracted.size === 0) {
        failed += batch.length;
        continue;
      }
      for (const candidate of batch) {
        const suggestion = extracted.get(candidate.id);
        if (!suggestion) {
          failed += 1;
          continue;
        }
        const key = cacheKey(config.modelId, candidate.addressText);
        fields.set(candidate.id, suggestion);
        cache[key] = {
          fields: suggestion,
          model: config.modelId,
          updatedAt: new Date().toISOString(),
        };
        fromModel += 1;
      }
      await saveCache(cachePath, cache);
    } catch {
      failed += batch.length;
    }
  }

  return { fields, fromCache, fromModel, failed };
}
