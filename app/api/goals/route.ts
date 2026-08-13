import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  target: z.number().int().min(1).max(100_000_000_000),
  saved: z.number().int().min(0).max(100_000_000_000).default(0),
  months: z.number().int().min(1).max(600),
});

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    goals: await db.goal.findMany({
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
    const g = await db.goal.create({ data: { ...b, userId: u.id } });
    return NextResponse.json({ goal: g }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid goal" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.goal.deleteMany({ where: { id, userId: u.id } });
  return NextResponse.json({ ok: true });
}
