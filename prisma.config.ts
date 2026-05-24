import { config } from "dotenv";
config({ path: ".env.local" });
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  // This datasource config is ONLY used for Prisma CLI commands (db push, migrate, introspect).
  // The runtime PrismaClient uses the DATABASE_URL (pooler) configured in lib/prisma.ts.
  // We use DIRECT_URL here to bypass pgbouncer, which doesn't support prepared statements
  // needed for schema DDL operations.
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"]!,
  },
});
