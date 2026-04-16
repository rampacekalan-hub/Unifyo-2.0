// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@unifyo.sk";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: "SUPERADMIN", membershipTier: "ENTERPRISE" },
    });
    console.log(`[SEED] Updated existing user ${email} to SUPERADMIN/ENTERPRISE`);
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      password: hashed,
      name: "Admin",
      role: "SUPERADMIN",
      membershipTier: "ENTERPRISE",
    },
  });
  console.log(`[SEED] Created SUPERADMIN: ${email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
