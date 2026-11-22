/** Runtime configuration. Every secret comes from `.env` - never inline a key. */

function required(name: string, fallback?: string): string {
  const value = Bun.env[name] ?? fallback;
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export const config = {
  nodeEnv: Bun.env.NODE_ENV ?? "development",
  port: Number(Bun.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/stars_erp"),
  redisUrl: Bun.env.REDIS_URL ?? "redis://localhost:6379",
  jwtSecret: Bun.env.JWT_SECRET ?? "dev-only-change-me",
  corsOrigin: (Bun.env.CORS_ORIGIN ?? "http://localhost:3000,http://localhost:8081").split(","),
  /** Default cycle: 26th -> 25th. */
  cutoffStartDay: Number(Bun.env.CUTOFF_START_DAY ?? 26),
  cutoffEndDay: Number(Bun.env.CUTOFF_END_DAY ?? 25),
} as const;

/** localhost, loopback, and the private IPv4 ranges used for dev LAN testing. */
const PRIVATE_HOST = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/;

/**
 * CORS allow-list.
 *
 * `CORS_ORIGIN` is authoritative in production. In development the dashboard is
 * often opened as `127.0.0.1:3000` or `192.168.x.x:3000` (phone / emulator), so
 * any private host is accepted there - otherwise every fetch is blocked by the
 * browser and the UI reports "API tidak dapat dihubungi".
 */
export function isCorsOriginAllowed(origin: string): boolean {
  if (config.corsOrigin.includes(origin)) return true;
  if (config.nodeEnv === "production") return false;
  try {
    return PRIVATE_HOST.test(new URL(origin).hostname);
  } catch {
    return false;
  }
}