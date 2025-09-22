import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// Users table definition
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  email: text("email"),   // 👈 new column (optional for now)
});
