import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, passwordVerify } from "@/lib/auth";
import { audit, getIp, getUserAgent, rateLimit } from "@/lib/security";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const rl = rateLimit(`login:${getIp(req)}`, 10, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 }
    );
  }

  try {
    const b = schema.parse(await req.json());
    const u = await db.user.findUnique({
      where: { email: b.email.toLowerCase() },
    });

    // Constant-ish response: always run verify if possible
    const valid =
      u &&
      !u.deletedAt &&
      (await passwordVerify(b.password, u.passwordHash));

    if (!valid || !u) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    await createSession(u.id, {
      ip: getIp(req),
      userAgent: getUserAgent(req),
    });
    await audit(u.id, "LOGIN", { ip: getIp(req) });

    return NextResponse.json({
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        plan: u.plan,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid login details." },
      { status: 400 }
    );
  }
}
