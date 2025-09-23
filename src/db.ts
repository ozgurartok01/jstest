import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const dbPath = process.env.DATABASE_URL;
const sqlite = new Database(dbPath);


// Connect Drizzle ORM to SQLite
export const db = drizzle(sqlite);
