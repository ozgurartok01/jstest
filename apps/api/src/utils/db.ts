import { config } from "dotenv";

config({ path: "../../.env" });
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../schemas/schema";

const sqlite = new Database(process.env.DATABASE_URL || "./sqlite.db");

// Connect Drizzle ORM to SQLite with schema
export const db = drizzle(sqlite, { schema });