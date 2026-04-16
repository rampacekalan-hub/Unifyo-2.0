// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

import { PrismaClient, MembershipTier } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const PLANS: Array<{
  tier: MembershipTier;
  label: string;
  dailyRequests: number | null;
  memorySlots: number;
  contextWindow: number;
  userPolicies: number;
  price: number;
  description: string;
}> = [
  {
    tier: "BASIC",
    label: "Basic",
    dailyRequests: 50,
    memorySlots: 200,
    contextWindow: 5,
    userPolicies: 2,
    price: 8.99,
    description: "Pre začínajúcich podnikateľov",
  },
  {
    tier: "PREMIUM",
    label: "Premium",
    dailyRequests: 500,
    memorySlots: 2000,
    contextWindow: 20,
    userPolicies: 5,
    price: 18.99,
    description: "Pre aktívnych podnikateľov",
  },
  {
    tier: "ENTERPRISE",
    label: "Enterprise",
    dailyRequests: null,
    memorySlots: 10000,
    contextWindow: 50,
    userPolicies: 20,
    price: 48.99,
    description: "Pre tímy a firmy",
  },
];

async function main() {
  for (const plan of PLANS) {
    const result = await prisma.membershipPlan.upsert({
      where: { tier: plan.tier },
      update: plan,
      create: plan,
    });
    console.log(`✓ ${result.tier}: ${result.label} — €${result.price}/mes`);
  }
  console.log("\nSeed hotový.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
