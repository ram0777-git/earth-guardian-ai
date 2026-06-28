import { defineConfig } from "drizzle-kit";
import path from "path";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("DATABASE_URL not set - database operations will not be available");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: databaseUrl ? {
    url: databaseUrl,
  } : undefined,
});
