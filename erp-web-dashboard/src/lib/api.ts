/**
 * Thin fetch wrapper around erp-backend-api. Every screen still renders with
 * sample data when the API is down, so callers must handle ApiError.
 */
/**
 * Base URL of erp-backend-api.
 *
 * `NEXT_PUBLIC_API_URL` wins when set. Otherwise the browser reuses the host it
 * was opened from and swaps in the API port, so opening the dashboard as
 * `192.168.1.2:3000` or `127.0.0.1:3000` still reaches the API on that machine.
 * Hard-coding `localhost` made every request fail off-device.
 */
function resolveApiUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }
  return "http://localhost:4000";
}

export const apiUrl = resolveApiUrl();

export class ApiError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError("API tidak dapat dihubungi. Jalankan setup-1 / setup-3 dulu.", "network");
  }

  const data = (await response.json().catch(() => null)) as
    | { error?: string; message?: string }
    | null;

  if (!response.ok) {
    throw new ApiError(data?.message ?? `HTTP ${response.status}`, data?.error);
  }

  // Handlers may also answer 200 with `{ error }`; treat that as a failure too.
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new ApiError(data.message ?? data.error, data.error);
  }

  return data as T;
}

/** Human readable copy for the API error codes this app actually returns. */
export const errorCopy: Record<string, string> = {
  network: "API tidak dapat dihubungi. Jalankan `npm run api:web` (atau api:web:mobile) lalu coba lagi.",
  wrong_current_password: "Sandi saat ini tidak cocok.",
  password_unchanged: "Sandi baru harus berbeda dari sandi lama.",
  password_too_short: "Sandi minimal 8 karakter.",
  token_invalid_or_expired: "Tautan reset sudah kedaluwarsa atau sudah dipakai. Minta tautan baru.",
  user_not_found: "Akun tidak ditemukan.",
  profile_not_found: "Profil tidak ditemukan.",
  VALIDATION: "Data yang dikirim belum valid.",
};

export function copyFor(error: unknown): string {
  if (error instanceof ApiError) {
    return errorCopy[error.code ?? ""] ?? error.message;
  }
  return "Terjadi kesalahan. Coba lagi.";
}