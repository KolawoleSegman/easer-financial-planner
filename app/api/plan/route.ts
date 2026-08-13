import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  income: z.number().int().min(0).max(100_000_000_000),
  savings: z.number().int().min(0).max(100_000_000_000),
  currency: z.string().min(1).max(5),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const plan = await db.financialPlan.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ plan });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = schema.parse(await req.json());
    const plan = await db.financialPlan.upsert({
      where: { userId: user.id },
      update: b,
      create: { ...b, userId: user.id },
    });
    await db.user.update({
      where: { id: user.id },
      data: { currency: b.currency },
    });
    return NextResponse.json({ plan });
  } catch {
    return NextResponse.json({ error: "Invalid plan data" }, { status: 400 });
  }
}
