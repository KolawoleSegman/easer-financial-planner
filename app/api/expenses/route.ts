import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  amount: z.number().int().min(0).max(100000000000),
  essential: z.boolean(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    expenses: await db.expense.findMany({
      where: { userId: u.id },
      orderBy: { createdAt: "desc" },
    }),
  });
}

export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = schema.parse(await req.json());
    const e = await db.expense.create({ data: { ...b, userId: u.id } });
    return NextResponse.json({ expense: e }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid expense" }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = z
      .object({
        id: z.string(),
        amount: z.number().int().min(0).max(100000000000),
        essential: z.boolean().optional(),
        name: z.string().min(1).max(100).optional(),
      })
      .parse(await req.json());
    const e = await db.expense.updateMany({
      where: { id: b.id, userId: u.id },
      data: {
        amount: b.amount,
        ...(b.essential === undefined ? {} : { essential: b.essential }),
        ...(b.name === undefined ? {} : { name: b.name }),
      },
    });
    return NextResponse.json({ ok: e.count === 1 });
  } catch {
    return NextResponse.json({ error: "Invalid expense" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.expense.deleteMany({ where: { id, userId: u.id } });
  return NextResponse.json({ ok: true });
}
