import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/security";

export async function GET() {
  const u = await getCurrentUser();
  if (!u || u.plan !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await db.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      createdAt: true,
      emailVerifiedAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  await audit(u.id, "ADMIN_LIST_USERS", { count: users.length });
  return NextResponse.json({ users });
}
