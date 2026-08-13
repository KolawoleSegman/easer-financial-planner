import crypto from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";

const COOKIE = "easer_session";
const DAYS = 14;
const BCRYPT_ROUNDS = 12;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, meta?: { userAgent?: string; ip?: string }) {
  const existing = await db.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (existing.length >= 5) {
    const toDelete = existing.slice(4).map((s) => s.id);
    if (toDelete.length) {
      await db.session.deleteMany({ where: { id: { in: toDelete } } });
    }
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + DAYS * 86400000);
  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      userAgent: meta?.userAgent?.slice(0, 300) || null,
      ip: meta?.ip?.slice(0, 64) || null,
    },
  });

  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await db.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  if (session.user.deletedAt) return null;

  return session.user;
}

export async function destroySession() {
  const token = cookies().get(COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookies().delete(COOKIE);
}

export async function destroyAllUserSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}

export const passwordHash = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);
export const passwordVerify = (password: string, hash: string) => bcrypt.compare(password, hash);

export const randomToken = () => crypto.randomBytes(32).toString("hex");
export const hashTokenForStorage = hashToken;

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 10) return "Password must be at least 10 characters.";
  if (password.length > 100) return "Password is too long.";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter.";
  if (!/[0-9]/.test(password)) return "Password must include a number.";
  return null;
}
