import type { Tokens } from "../types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

let accessToken: string | null = null;
let refreshToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

const ACCESS_KEY = "budgetx.access";
const REFRESH_KEY = "budgetx.refresh";

export function setTokens(access: string | null, refresh?: string | null) {
  accessToken = access;
  if (refresh !== undefined) refreshToken = refresh;
  if (access && refresh) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  } else if (!access) {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}

export function restoreTokens(): { access: string; refresh: string } | null {
  const access = localStorage.getItem(ACCESS_KEY);
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (access && refresh) {
    accessToken = access;
    refreshToken = refresh;
    return { access, refresh };
  }
  return null;
}

export function hasToken() {
  return accessToken !== null;
}

export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface ApiResult<T> {
  data: T;
  status: number;
}

async function rawRequest<T>(
  path: string,
  init: RequestInit,
  token: string | null
): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${BASE}${path}`, { ...init, headers });
  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  return { data: payload as T, status: response.status };
}

function extractFieldErrors(payload: unknown): Record<string, string> | undefined {
  if (payload && typeof payload === "object" && "errors" in payload) {
    const errors = (payload as { errors: Array<{ field: string; message: string }> }).errors;
    if (Array.isArray(errors)) {
      const map: Record<string, string> = {};
      for (const e of errors) map[e.field] = e.message;
      return map;
    }
  }
  return undefined;
}

async function tryRefresh(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const result = await rawRequest<{ tokens?: Tokens; detail?: string }>(
      "/auth/refresh",
      { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) },
      null
    );
    if (result.status === 200 && result.data?.tokens) {
      setTokens(result.data.tokens.access_token, result.data.tokens.refresh_token);
      return true;
    }
  } catch {
    /* network failure during refresh */
  }
  return false;
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const init: RequestInit = {
    method: options.method ?? "GET",
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  };

  let result = await rawRequest<T>(path, init, accessToken);

  if ((result.status === 401 || result.status === 403) && accessToken) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      result = await rawRequest<T>(path, init, accessToken);
    } else {
      setTokens(null);
      onSessionExpired?.();
    }
  }

  if (result.status === 204) return undefined as T;

  if (result.status >= 400) {
    const detail =
      result.data && typeof result.data === "object" && "detail" in result.data
        ? String((result.data as { detail: unknown }).detail)
        : "Something went wrong. Please try again.";
    throw new ApiError(result.status, detail, extractFieldErrors(result.data));
  }
  return result.data;
}

export function get<T>(path: string): Promise<T> {
  return api<T>(path);
}
export function post<T>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, { method: "POST", body });
}
export function put<T>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, { method: "PUT", body });
}
export function patch<T>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, { method: "PATCH", body });
}
export function del(path: string): Promise<void> {
  return api<void>(path, { method: "DELETE" });
}
