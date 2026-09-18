import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const databaseUrl =
  process.env.DATABASE_TURSO_DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
const authToken =
  process.env.DATABASE_TURSO_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl || !authToken) {
  throw new Error(
    "A Turso database URL and auth token are required. Set DATABASE_TURSO_DATABASE_URL and DATABASE_TURSO_AUTH_TOKEN (or TURSO_DATABASE_URL and TURSO_AUTH_TOKEN).",
  );
}

if (!databaseUrl.startsWith("libsql://") && !databaseUrl.startsWith("https://")) {
  throw new Error(
    "The Turso database URL must start with libsql:// or https://. Do not use a local file: URL in production.",
  );
}

const adapter = new PrismaLibSql({
  url: databaseUrl,
  authToken,
});
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
