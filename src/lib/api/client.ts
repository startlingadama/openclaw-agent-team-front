// Centralized HTTP client for the external Python backend.
// No component should call fetch directly - go through `api` in ./index.ts.

const BASE_KEY = "openclaw.apiBaseUrl";
const TOKEN_KEY = "openclaw.token";
const DEFAULT_BASE_URL = "http://127.0.0.1:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const isBrowser = () => typeof window !== "undefined";

/** Backend base URL: user override (Settings) > build-time override > local backend. */
export function getBaseUrl(): string {
  const override = isBrowser() ? window.localStorage.getItem(BASE_KEY) : null;
  const env = (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "";
  return (override || env || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

/** Only http(s) origins are accepted: blocks javascript:/data: injection via Settings. */
export function isValidBaseUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function setBaseUrl(url: string | null) {
  if (!isBrowser()) return;
  const v = url?.trim();
  if (v) {
    if (!isValidBaseUrl(v)) throw new ApiError("Enter a valid http(s) backend URL.", 0);
    window.localStorage.setItem(BASE_KEY, v);
  } else window.localStorage.removeItem(BASE_KEY);
}

export function getToken(): string | null {
  return isBrowser() ? window.localStorage.getItem(TOKEN_KEY) : null;
}

export function setToken(token: string | null) {
  if (!isBrowser()) return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

type Options = { method?: string; body?: unknown; signal?: AbortSignal };

export async function request<T>(path: string, opts: Options = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${getBaseUrl()}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : null,
    signal: opts.signal ?? null,
  }).catch((e: unknown) => {
    throw new ApiError(`Backend unreachable: ${(e as Error).message}`, 0);
  });

  const text = await res.text();
  const data = text ? safeJson(text) : undefined;
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && ("detail" in data || "message" in data)
        ? String((data as Record<string, unknown>)["detail"] ?? (data as Record<string, unknown>)["message"])
        : null) ?? `Request failed (${res.status})`;
    if (res.status === 401) setToken(null);
    throw new ApiError(msg, res.status, data);
  }
  return data as T;
}

/** Authenticated download of a binary or text file (the Bearer token cannot go in a plain link). */
export async function requestBlob(path: string, signal?: AbortSignal): Promise<Blob> {
  const token = getToken();
  const res = await fetch(`${getBaseUrl()}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal: signal ?? null,
  }).catch((e: unknown) => {
    throw new ApiError(`Backend unreachable: ${(e as Error).message}`, 0);
  });
  if (!res.ok) {
    if (res.status === 401) setToken(null);
    const message =
      res.status === 404 ? "This document no longer exists." : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return res.blob();
}

function safeJson(t: string) {
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}
