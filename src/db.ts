import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

// Open or create SQLite database file
const sqlite = new Database("sqlite.db");

// Connect Drizzle ORM to SQLite
export const db = drizzle(sqlite);
