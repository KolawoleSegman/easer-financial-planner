import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  passwordHash,
  hashTokenForStorage,
  destroyAllUserSessions,
  validatePasswordStrength,
} from "@/lib/auth";
import { audit } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const b = z
      .object({
        token: z.string().min(20).max(200),
        password: z.string().min(10).max(100),
      })
      .parse(await req.json());

    const strength = validatePasswordStrength(b.password);
    if (strength) {
      return NextResponse.json({ error: strength }, { status: 400 });
    }

    const tokenHash = hashTokenForStorage(b.token);
    const u = await db.user.findFirst({
      where: {
        resetTokenHash: tokenHash,
        resetExpiresAt: { gt: new Date() },
        deletedAt: null,
      },
    });

    if (!u) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id: u.id },
      data: {
        passwordHash: await passwordHash(b.password),
        resetTokenHash: null,
        resetExpiresAt: null,
      },
    });

    // Invalidate all sessions after password change
    await destroyAllUserSessions(u.id);
    await audit(u.id, "PASSWORD_RESET", {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
