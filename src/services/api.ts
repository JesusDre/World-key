const DEFAULT_BASE_URL = "/api";

// Leer import.meta.env de forma defensiva: en algunos entornos (p.ej. builds
// servidos incorrectamente o herramientas) `import.meta.env` puede ser
// undefined en tiempo de ejecución. Normalmente Vite reemplaza esto en
// tiempo de compilación, pero añadimos un fallback seguro para evitar un
// crash en el cliente.
const safeMeta: { env?: Record<string, string | undefined> } =
  typeof import.meta !== "undefined" ? (import.meta as any) : {};
const rawBase = safeMeta.env?.VITE_API_BASE_URL;
const baseUrl = rawBase && rawBase.length > 0 ? rawBase.replace(/\/$/, "") : DEFAULT_BASE_URL;

export type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function buildUrl(path: string): string {
  if (!path.startsWith("/")) {
    return `${baseUrl}/${path}`;
  }
  return `${baseUrl}${path}`;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, headers = {}, signal } = options;

  const init: RequestInit = {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    signal,
  };

  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path), init);
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const message =
      (isJson && payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message?: string }).message)
        : null) ?? response.statusText;
    throw new ApiError(message, response.status, payload);
  }

  return (payload ?? null) as T;
}

export function getApiBaseUrl(): string {
  return baseUrl;
}
