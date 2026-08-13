import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = process.env.SEED_DEMO_EMAIL || "demo@easerfinancial.com";
  const password = process.env.SEED_DEMO_PASSWORD || "DemoPassword123!";

  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Demo User",
      passwordHash: await bcrypt.hash(password, 12),
      emailVerifiedAt: new Date(),
    },
  });

  await db.financialPlan.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      income: 500000,
      savings: 50000,
      currency: "NGN",
    },
  });

  console.log(`Demo user ready: ${email}`);
}

main().finally(() => db.$disconnect());
