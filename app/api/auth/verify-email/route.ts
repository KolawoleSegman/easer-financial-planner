import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/security";

export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token || token.length < 20) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const u = await db.user.findFirst({
    where: { verificationToken: token, deletedAt: null },
  });
  if (!u) {
    return NextResponse.json(
      { error: "Invalid verification token." },
      { status: 400 }
    );
  }

  await db.user.update({
    where: { id: u.id },
    data: { emailVerifiedAt: new Date(), verificationToken: null },
  });
  await audit(u.id, "EMAIL_VERIFIED", {});

  return NextResponse.json({ ok: true });
}
