import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const db = drizzle(databaseUrl, { schema });
export { db };
