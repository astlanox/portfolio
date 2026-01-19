/**
 * Strapi client with optional dev snapshot mode.
 *
 * Snapshot mode (dev only):
 * - Set `STRAPI_SNAPSHOT=1` (or `true`) to read from a local JSON snapshot instead of calling Strapi.
 * - Snapshot file is a temporary, gitignored artifact.
 *   Default location: `temp/strapi-snapshot.json`
 * - Optional override: `STRAPI_SNAPSHOT_PATH` (e.g. `temp/strapi-snapshot.json`)
 *
 * Write-back behavior:
 * - On snapshot miss, the raw JSON response from Strapi is automatically appended into the snapshot file.
 */

type Props = {
  endpoint: string;
  query?: Record<string, string>;
  wrappedByKey?: string;
  wrappedByList?: boolean;
};

type SnapshotStore = Record<string, unknown>;

type JsonObject = Record<string, unknown>;

const unwrapByKey = (value: unknown, key?: string) => {
  if (!key) return value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as JsonObject;
    return key in obj ? obj[key] : undefined;
  }
  return undefined;
};

const unwrapFirst = (value: unknown, enabled?: boolean) => {
  if (!enabled) return value;
  return Array.isArray(value) ? value[0] : value;
};

const isSnapshotEnabled = () => {
  // Snapshot is only meaningful on the server.
  // Guarding with SSR avoids bundlers pulling Node-only modules into client builds.
  const flag = import.meta.env.STRAPI_SNAPSHOT;
  return (
    import.meta.env.DEV &&
    import.meta.env.SSR &&
    (flag === "1" || flag === "true")
  );
};

const normalizeEndpoint = (endpoint: string) =>
  endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

const buildSnapshotKey = (endpoint: string, query?: Record<string, string>) => {
  const base = normalizeEndpoint(endpoint);
  if (!query || Object.keys(query).length === 0) return base;

  const params = new URLSearchParams();
  Object.keys(query)
    .sort()
    .forEach((k) => params.append(k, query[k]));

  return `${base}?${params.toString()}`;
};

const resolveSnapshotFileUrl = () => {
  // Default: projectRoot/temp/strapi-snapshot.json
  // This file lives at: src/libs/cms.ts -> ../../temp/...
  const rel =
    import.meta.env.STRAPI_SNAPSHOT_PATH || "temp/strapi-snapshot.json";

  // If user provides an absolute file:// URL, respect it.
  if (typeof rel === "string" && rel.startsWith("file://")) return new URL(rel);

  // Otherwise treat it as project-root relative.
  return new URL(`../../${rel.replace(/^\/+/, "")}`, import.meta.url);
};

let snapshotCache: SnapshotStore | null = null;
let snapshotUnavailable = false;
let snapshotWarned = false;

const readSnapshotStore = async (): Promise<SnapshotStore> => {
  if (snapshotUnavailable) return {};
  if (snapshotCache) return snapshotCache;

  const fs = await import("node:fs/promises");

  const fileUrl = resolveSnapshotFileUrl();

  try {
    const raw = await fs.readFile(fileUrl, "utf-8");

    const parsed = JSON.parse(raw) as SnapshotStore;
    snapshotCache = parsed;
    return parsed;
  } catch (err: unknown) {
    // Create the snapshot file if missing
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: unknown }).code === "ENOENT"
    ) {
      try {
        const pathMod = await import("node:path");

        const dir = pathMod.dirname(fileUrl.pathname);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(fileUrl, "{}\n", "utf-8");

        snapshotCache = {};

        if (!snapshotWarned) {
          snapshotWarned = true;
          console.warn(
            `[cms] Snapshot file was missing and has been created at ${fileUrl.pathname}.`,
          );
        }

        return snapshotCache;
      } catch (createErr: unknown) {
        snapshotUnavailable = true;
        if (!snapshotWarned) {
          snapshotWarned = true;
          console.warn(
            "[cms] Snapshot file was missing but could not be created. Falling back to Strapi fetch.",
            createErr,
          );
        }
        return {};
      }
    }

    snapshotUnavailable = true;
    if (!snapshotWarned) {
      snapshotWarned = true;
      console.warn(
        "[cms] Failed to read snapshot. Disabling snapshot mode for this session.",
        err,
      );
    }
    return {};
  }
};

const writeSnapshotEntry = async (key: string, value: unknown) => {
  if (snapshotUnavailable) return;

  const fs = await import("node:fs/promises");

  const fileUrl = resolveSnapshotFileUrl();

  // Ensure the store exists (and the file exists)
  const store = await readSnapshotStore();

  const next: SnapshotStore = { ...store, [key]: value };
  snapshotCache = next;

  try {
    await fs.writeFile(fileUrl, `${JSON.stringify(next, null, 2)}\n`, "utf-8");
  } catch (err: unknown) {
    snapshotUnavailable = true;
    if (!snapshotWarned) {
      snapshotWarned = true;
      console.warn(
        "[cms] Failed to write snapshot. Disabling snapshot mode for this session.",
        err,
      );
    }
  }
};

const buildStrapiUrl = (endpoint: string, query?: Record<string, string>) => {
  const base = import.meta.env.STRAPI_URL;
  if (!base) {
    throw new Error("[cms] STRAPI_URL is not set.");
  }

  const url = new URL(
    `${base.replace(/\/$/, "")}/api/${normalizeEndpoint(endpoint)}`,
  );

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  return url;
};

/**
 * Fetches data from the Strapi API
 */
export const fetchApi = async <T>({
  endpoint,
  query,
  wrappedByKey,
  wrappedByList,
}: Props): Promise<T> => {
  const snapshotOn = isSnapshotEnabled();

  const snapshotKey = snapshotOn ? buildSnapshotKey(endpoint, query) : null;
  let snapshotMiss = false;

  // Dev snapshot mode: skip HTTP calls for faster reloads
  if (snapshotOn && snapshotKey) {
    try {
      const store = await readSnapshotStore();

      if (Object.prototype.hasOwnProperty.call(store, snapshotKey)) {
        let data: unknown = store[snapshotKey];

        data = unwrapByKey(data, wrappedByKey);
        data = unwrapFirst(data, wrappedByList);

        return data as unknown as T;
      }

      // Snapshot miss: fall through to Strapi fetch so dev isn't blocked.
      snapshotMiss = true;
      console.warn(
        `[cms] Snapshot miss for key: ${snapshotKey}. Falling back to Strapi fetch.`,
      );
    } catch {
      // readSnapshotStore logs and handles its own failures
    }
  }

  const url = buildStrapiUrl(endpoint, query);

  const token = import.meta.env.STRAPI_API_TOKEN;
  if (!token) {
    throw new Error("[cms] STRAPI_API_TOKEN is not set.");
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {
      // ignore
    }

    throw new Error(
      `[cms] Strapi request failed: ${res.status} ${res.statusText} (${url.toString()})` +
        (body ? `\n${body.slice(0, 800)}` : ""),
    );
  }

  const raw: unknown = await res.json();

  // Write-back: only when snapshot mode is enabled and the key was missing.
  if (snapshotOn && snapshotKey && snapshotMiss) {
    await writeSnapshotEntry(snapshotKey, raw);
  }

  let data: unknown = raw;
  data = unwrapByKey(data, wrappedByKey);
  data = unwrapFirst(data, wrappedByList);

  return data as unknown as T;
};

export default fetchApi;
