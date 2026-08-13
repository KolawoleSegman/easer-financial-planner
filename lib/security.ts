import crypto from "crypto";
import { db } from "./db";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * In-memory rate limiter for single-instance / local development only.
 * Production multi-instance deployments MUST use Redis/Upstash (see SECURITY.md).
 */
export function rateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  current.count++;
  return { ok: current.count <= limit, remaining: Math.max(0, limit - current.count) };
}

export async function audit(userId: string | null, action: string, metadata?: unknown) {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        metadata: metadata as object | undefined,
      },
    });
  } catch {
    // Audit must not break primary flows
  }
}

export function getIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function getUserAgent(req: Request) {
  return req.headers.get("user-agent") || undefined;
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
