import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const connectionString =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.NEON_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "A Postgres database URL is required. Set DATABASE_URL to your Neon pooled connection string, for example postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require.",
  );
}

if (
  !connectionString.startsWith("postgres://") &&
  !connectionString.startsWith("postgresql://")
) {
  throw new Error(
    "The Neon database URL must start with postgres:// or postgresql://.",
  );
}

const adapter = new PrismaNeon({ connectionString });

function createClient() {
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
