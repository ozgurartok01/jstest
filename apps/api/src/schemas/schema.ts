import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Users table definition
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
});

// Emails table definition
export const emails = sqliteTable("emails", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  email: text("email").notNull(),
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
  isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  deletedAt: text("deleted_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  emails: many(emails),
}));

export const emailsRelations = relations(emails, ({ one }) => ({
  user: one(users, {
    fields: [emails.userId],
    references: [users.id],
  }),
}));