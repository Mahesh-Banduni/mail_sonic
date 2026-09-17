import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import "dotenv/config";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.startsWith("change-this")) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding.",
    );
  }
  await prisma.user.upsert({
    where: { email },
    update: {
      name: "Immortify Admin",
      passwordHash: await bcrypt.hash(password, 12),
    },
    create: {
      email,
      name: "Immortify Admin",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
}
main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
