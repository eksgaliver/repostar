/**
 * Auth & RBAC for the controller layer.
 *
 * Tokens are compact HMAC-SHA256 tickets (`base64url(payload).signature`), so no
 * extra dependency is needed. A controller calls `guard()` first and only then
 * touches a model - that keeps "alur dan auth" in C, as the MVC split requires.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { config } from "../config";
import { db, schema } from "../db/client";

export type Role = "super_admin" | "admin" | "hr_admin" | "opr_admin" | "kpi_admin" | "manager" | "staff";

export interface Principal {
  userId: string;
  companyId: string | null;
  role: Role;
  email: string;
}

export type Headers = Record<string, string | undefined>;

const TOKEN_TTL_SECONDS = 60 * 60 * 12;

const encode = (value: string) => Buffer.from(value, "utf8").toString("base64url");
const decode = (value: string) => Buffer.from(value, "base64url").toString("utf8");

export function signToken(principal: Principal, ttlSeconds = TOKEN_TTL_SECONDS): string {
  const payload = { ...principal, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const body = encode(JSON.stringify(payload));
  const signature = createHmac("sha256", config.jwtSecret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyToken(token: string): Principal | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = createHmac("sha256", config.jwtSecret).update(body).digest("base64url");
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return null;

  try {
    const payload = JSON.parse(decode(body)) as Principal & { exp?: number };
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    return {
      userId: payload.userId,
      companyId: payload.companyId ?? null,
      role: payload.role,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

function bearer(headers: Headers): string | null {
  const raw = headers.authorization ?? headers.Authorization ?? "";
  return raw.toLowerCase().startsWith("bearer ") ? raw.slice(7).trim() : null;
}

/**
 * Resolve the caller. Without an Authorization header the development build
 * falls back to the first Super Admin so the dashboard stays usable before a
 * login screen exists; production returns null and the guard rejects.
 */
export async function currentPrincipal(headers: Headers): Promise<Principal | null> {
  const token = bearer(headers);
  if (token) {
    const principal = verifyToken(token);
    if (principal) return principal;
  }

  if (config.nodeEnv === "production") return null;

  const [user] = await db.select().from(schema.users).where(eq(schema.users.role, "super_admin")).limit(1);
  if (!user) return null;
  return { userId: user.id, companyId: user.companyId, role: user.role, email: user.email };
}

export function hasRole(principal: Principal, roles: Role[]): boolean {
  if (principal.role === "super_admin") return true;
  return roles.includes(principal.role);
}

/** A tenant guard: everyone but the super admin is locked to their company_id. */
export function canAccessCompany(principal: Principal, companyId: string | null | undefined): boolean {
  if (principal.role === "super_admin") return true;
  if (!companyId) return true;
  return principal.companyId === companyId;
}

export type GuardResult = { principal: Principal } | { error: string; status: 401 | 403 };

export async function guard(headers: Headers, roles?: Role[]): Promise<GuardResult> {
  const principal = await currentPrincipal(headers);
  if (!principal) return { error: "unauthenticated", status: 401 };
  if (roles && !hasRole(principal, roles)) return { error: "forbidden", status: 403 };
  return { principal };
}

export const TOKEN_TTL = TOKEN_TTL_SECONDS;