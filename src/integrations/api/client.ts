const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(
  /\/$/,
  "",
);

export type ApiError = { status: number; message: string; body?: unknown };

let tokenGetter: (() => Promise<string | null>) | null = null;

export function setApiAccessTokenGetter(fn: () => Promise<string | null>) {
  tokenGetter = fn;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (auth && tokenGetter) {
    const token = await tokenGetter();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_URL}/api${path}`, { ...options, headers });
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    const message =
      typeof body === "object" &&
      body &&
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
        ? (body as { message: string }).message
        : res.statusText;
    throw { status: res.status, message, body } satisfies ApiError;
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, auth = true) => request<T>(path, { method: "GET" }, auth),
  post: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(
      path,
      { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined },
      auth,
    ),
  put: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(
      path,
      { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined },
      auth,
    ),
  patch: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(
      path,
      { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined },
      auth,
    ),
  delete: <T>(path: string, auth = true) =>
    request<T>(path, { method: "DELETE" }, auth),
  /** Streaming POST (AI coach / policy support chat). Returns raw Response. Attaches Bearer when available. */
  streamPost: async (path: string, body: unknown) => {
    const headers = new Headers({ "Content-Type": "application/json" });
    if (tokenGetter) {
      const token = await tokenGetter();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(`${API_URL}/api${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  },
  baseUrl: API_URL,
};
