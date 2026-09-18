import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const databaseUrl = process.env.DATABASE_TURSO_DATABASE_URL;
const authToken = process.env.DATABASE_TURSO_AUTH_TOKEN;

if (!databaseUrl || !authToken) {
  throw new Error(
    "DATABASE_TURSO_DATABASE_URL and DATABASE_TURSO_AUTH_TOKEN are required",
  );
}

const adapter = new PrismaLibSql({
  url: databaseUrl,
  authToken,
});
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
