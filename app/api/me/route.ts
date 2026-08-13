import { NextResponse } from "next/server";
import { getCurrentUser, destroySession, destroyAllUserSessions } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/security";
import { z } from "zod";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      plan: user.plan,
      emailVerifiedAt: user.emailVerifiedAt,
    },
  });
}

/** Account deletion — soft-delete + purge personal financial data */
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const { confirm } = z
      .object({ confirm: z.literal("DELETE MY ACCOUNT") })
      .parse(body);

    if (confirm !== "DELETE MY ACCOUNT") {
      return NextResponse.json({ error: "Confirmation required" }, { status: 400 });
    }

    // Do not auto-cancel active Paystack subscriptions without provider call —
    // flag for ops; still soft-delete the account.
    await db.$transaction(async (tx) => {
      await tx.expense.deleteMany({ where: { userId: user.id } });
      await tx.goal.deleteMany({ where: { userId: user.id } });
      await tx.financialPlan.deleteMany({ where: { userId: user.id } });
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.user.update({
        where: { id: user.id },
        data: {
          deletedAt: new Date(),
          email: `deleted_${user.id}@deleted.local`,
          name: null,
          passwordHash: "DELETED",
          verificationToken: null,
          resetTokenHash: null,
          resetExpiresAt: null,
          plan: "FREE",
        },
      });
    });

    await audit(user.id, "ACCOUNT_DELETED", {});
    await destroySession();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete account" }, { status: 400 });
  }
}
