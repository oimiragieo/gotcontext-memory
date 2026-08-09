import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileExists } from "./hash.js";

export type StoreConfig = {
  dream: {
    enabled: boolean;
    policy: {
      focus?: string[];
      excludeSources?: string[];
      maxProposals?: number;
    };
  };
  memory: {
    policy: Record<string, unknown>;
  };
  secrets: {
    allowlist: string[];
  };
};

const FORBIDDEN_KEYS = new Set([
  "dream.schedule",
  "dream.auto",
  "schedule",
  "auto",
]);

export const DEFAULT_CONFIG: StoreConfig = {
  dream: { enabled: false, policy: {} },
  memory: { policy: {} },
  secrets: { allowlist: [] },
};

export function validateConfigObject(raw: unknown): StoreConfig {
  if (!raw || typeof raw !== "object") {
    throw new Error("config must be an object");
  }
  const obj = raw as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!["dream", "memory", "secrets"].includes(key)) {
      throw new Error(`Unknown config key: ${key}`);
    }
  }
  const dream = (obj.dream ?? {}) as Record<string, unknown>;
  for (const k of Object.keys(dream)) {
    const dotted = `dream.${k}`;
    if (FORBIDDEN_KEYS.has(dotted) || FORBIDDEN_KEYS.has(k)) {
      throw new Error(`Forbidden config key: ${dotted}`);
    }
  }
  if ("schedule" in dream || "auto" in dream) {
    throw new Error("Forbidden config key: dream.schedule/auto");
  }
  const secrets = (obj.secrets ?? {}) as Record<string, unknown>;
  const allowlist = Array.isArray(secrets.allowlist)
    ? secrets.allowlist.map(String)
    : [];
  const memory = (obj.memory ?? { policy: {} }) as StoreConfig["memory"];
  const policy = (dream.policy ?? {}) as StoreConfig["dream"]["policy"];
  return {
    dream: {
      enabled: Boolean(dream.enabled ?? false),
      policy,
    },
    memory: {
      policy: (memory.policy ?? {}) as Record<string, unknown>,
    },
    secrets: { allowlist },
  };
}

export async function loadConfig(storeRoot: string): Promise<StoreConfig> {
  const p = path.join(storeRoot, "config.json");
  if (!(await fileExists(p))) return { ...DEFAULT_CONFIG };
  const raw = JSON.parse(await readFile(p, "utf8"));
  return validateConfigObject(raw);
}

/** Pure: default config bytes for the sole writer (`store.ts`) to persist. */
export function defaultConfigJson(): string {
  return JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n";
}
