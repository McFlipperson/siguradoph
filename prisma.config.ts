import { config } from "dotenv";
config({ path: ".env.local" });
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
    // directUrl is used by Supabase to bypass the connection pooler for migrations
    // @ts-expect-error — directUrl supported at runtime even if not in types yet
    directUrl: process.env["DIRECT_URL"],
  },
});
