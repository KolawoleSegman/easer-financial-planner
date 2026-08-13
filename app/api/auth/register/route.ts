import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  createSession,
  passwordHash,
  randomToken,
  validatePasswordStrength,
} from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { audit, getIp, getUserAgent, rateLimit } from "@/lib/security";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().max(160),
  password: z.string().min(10).max(100),
});

export async function POST(req: Request) {
  const rl = rateLimit(`register:${getIp(req)}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      { status: 429 }
    );
  }

  try {
    const b = schema.parse(await req.json());
    const strength = validatePasswordStrength(b.password);
    if (strength) {
      return NextResponse.json({ error: strength }, { status: 400 });
    }

    const email = b.email.toLowerCase();
    if (await db.user.findUnique({ where: { email } })) {
      // Generic message reduces account enumeration slightly; still returns 409 for UX
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const token = randomToken();
    const user = await db.user.create({
      data: {
        name: b.name,
        email,
        passwordHash: await passwordHash(b.password),
        verificationToken: token,
      },
    });

    await createSession(user.id, {
      ip: getIp(req),
      userAgent: getUserAgent(req),
    });
    await sendVerificationEmail(email, token);
    await audit(user.id, "ACCOUNT_CREATED", { ip: getIp(req) });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
        },
        verificationSent: true,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid registration details." },
      { status: 400 }
    );
  }
}
