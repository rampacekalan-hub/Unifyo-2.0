/**
 * One-time script: upgrades a user to SUPERADMIN role.
 * Usage: npx tsx scripts/make-superadmin.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const TARGET_EMAIL = "alanrampacek@prosight.sk";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } });

  if (!user) {
    console.error(`❌  User ${TARGET_EMAIL} not found in database.`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { email: TARGET_EMAIL },
    data: { role: "SUPERADMIN" },
    select: { id: true, email: true, role: true, plan: true },
  });

  console.log("✅  Role updated:");
  console.table([updated]);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
