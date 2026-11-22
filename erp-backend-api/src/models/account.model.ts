/**
 * Model layer - account domain.
 * Every database read/write and password rule lives here; controllers only
 * orchestrate (auth, validation, status codes).
 */
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "../db/client";

export const PASSWORD_MIN_LENGTH = 8;
export const RESET_TTL_MINUTES = 30;

const profileColumns = {
  id: schema.users.id,
  email: schema.users.email,
  fullName: schema.users.fullName,
  role: schema.users.role,
  isActive: schema.users.isActive,
  lastLoginAt: schema.users.lastLoginAt,
  createdAt: schema.users.createdAt,
  companyId: schema.companies.id,
  companyCode: schema.companies.code,
  companyName: schema.companies.name,
  employeeId: schema.employees.id,
  employeeCode: schema.employees.employeeCode,
  employeeType: schema.employees.type,
  nickname: schema.employees.nickname,
  phone: schema.employees.phone,
  address: schema.employees.address,
  joinDate: schema.employees.joinDate,
  isDepartmentHead: schema.employees.isDepartmentHead,
  regionCode: schema.regions.code,
  regionName: schema.regions.name,
  departmentName: schema.departments.name,
};

export type ProfileRow = Awaited<ReturnType<typeof findProfile>>;

export async function findProfile(userId?: string) {
  const where = userId ? eq(schema.users.id, userId) : eq(schema.users.role, "super_admin");
  const [row] = await db
    .select(profileColumns)
    .from(schema.users)
    .leftJoin(schema.companies, eq(schema.companies.id, schema.users.companyId))
    .leftJoin(schema.employees, eq(schema.employees.id, schema.users.employeeId))
    .leftJoin(schema.regions, eq(schema.regions.id, schema.employees.regionId))
    .leftJoin(schema.departments, eq(schema.departments.id, schema.employees.departmentId))
    .where(where)
    .limit(1);
  return row ?? null;
}

export async function findUserById(userId: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  return user ?? null;
}

export async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1);
  return user ?? null;
}

export interface UpdateProfileInput {
  userId: string;
  fullName?: string;
  email?: string;
  nickname?: string;
  phone?: string;
  address?: string;
}

export async function updateProfile(input: UpdateProfileInput) {
  const user = await findUserById(input.userId);
  if (!user) return null;

  await db
    .update(schema.users)
    .set({
      fullName: input.fullName ?? user.fullName,
      email: input.email ? input.email.toLowerCase() : user.email,
    })
    .where(eq(schema.users.id, user.id));

  if (user.employeeId) {
    await db
      .update(schema.employees)
      .set({ nickname: input.nickname, phone: input.phone, address: input.address })
      .where(eq(schema.employees.id, user.employeeId));
  }

  return findProfile(user.id);
}

/** Returns a typed reason instead of a boolean so the controller can answer precisely. */
export type PasswordCheck = "ok" | "user_not_found" | "wrong_current_password" | "password_unchanged" | "password_too_short";

export async function checkPasswordChange(userId: string, currentPassword: string, newPassword: string): Promise<PasswordCheck> {
  if (newPassword.length < PASSWORD_MIN_LENGTH) return "password_too_short";

  const user = await findUserById(userId);
  if (!user) return "user_not_found";

  const valid = await Bun.password.verify(currentPassword, user.passwordHash);
  if (!valid) return "wrong_current_password";
  if (currentPassword === newPassword) return "password_unchanged";
  return "ok";
}

export async function changePassword(userId: string, newPassword: string) {
  await db
    .update(schema.users)
    .set({ passwordHash: await Bun.password.hash(newPassword) })
    .where(eq(schema.users.id, userId));
  await revokeResetTokens(userId);
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function revokeResetTokens(userId: string) {
  await db.delete(schema.passwordResetTokens).where(eq(schema.passwordResetTokens.userId, userId));
}

export interface IssuedResetToken {
  token: string;
  expiresAt: Date;
}

export async function createResetToken(userId: string): Promise<IssuedResetToken> {
  await revokeResetTokens(userId);

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60_000);

  await db.insert(schema.passwordResetTokens).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });

  return { token, expiresAt };
}

async function findValidResetToken(token: string) {
  const [record] = await db
    .select()
    .from(schema.passwordResetTokens)
    .where(
      and(
        eq(schema.passwordResetTokens.tokenHash, hashToken(token)),
        isNull(schema.passwordResetTokens.usedAt),
        gt(schema.passwordResetTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return record ?? null;
}

export async function isResetTokenValid(token: string): Promise<boolean> {
  return Boolean(await findValidResetToken(token));
}

export async function consumeResetToken(token: string, newPassword: string): Promise<boolean> {
  const record = await findValidResetToken(token);
  if (!record) return false;

  await db
    .update(schema.users)
    .set({ passwordHash: await Bun.password.hash(newPassword) })
    .where(eq(schema.users.id, record.userId));

  await db
    .update(schema.passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(schema.passwordResetTokens.id, record.id));

  return true;
}

export async function verifyCredentials(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user || !user.isActive) return null;
  const valid = await Bun.password.verify(password, user.passwordHash);
  return valid ? user : null;
}

export async function touchLastLogin(userId: string) {
  await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, userId));
}

export async function listUsers() {
  return db.select().from(schema.users);
}

export async function createUser(input: {
  companyId?: string;
  employeeId?: string;
  email: string;
  password: string;
  fullName: string;
  role: "super_admin" | "admin" | "hr_admin" | "opr_admin" | "manager" | "staff";
}) {
  return db
    .insert(schema.users)
    .values({
      companyId: input.companyId,
      employeeId: input.employeeId,
      email: input.email.toLowerCase(),
      passwordHash: await Bun.password.hash(input.password),
      fullName: input.fullName,
      role: input.role,
    })
    .returning();
}