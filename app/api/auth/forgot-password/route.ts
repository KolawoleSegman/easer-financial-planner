import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { randomToken, hashTokenForStorage } from "@/lib/auth";
import { sendResetEmail } from "@/lib/email";
import { getIp, rateLimit } from "@/lib/security";

export async function POST(req: Request) {
  const rl = rateLimit(`forgot:${getIp(req)}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Try again later." }, { status: 429 });
  }

  try {
    const { email } = z
      .object({ email: z.string().email() })
      .parse(await req.json());
    const u = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (u && !u.deletedAt) {
      const token = randomToken();
      await db.user.update({
        where: { id: u.id },
        data: {
          resetTokenHash: hashTokenForStorage(token),
          resetExpiresAt: new Date(Date.now() + 3600000),
        },
      });
      await sendResetEmail(u.email, token);
    }

    // Always same response — prevents account enumeration
    return NextResponse.json({
      message: "If that email exists, a reset link has been sent.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
