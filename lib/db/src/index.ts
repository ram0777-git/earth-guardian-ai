import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("DATABASE_URL not set - database operations will not be available");
}

export const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
export const db = databaseUrl ? drizzle(pool, { schema }) : null;

export * from "./schema";
