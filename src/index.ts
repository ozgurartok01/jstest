import express, { Request, Response, NextFunction } from "express";

import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

import { z } from "zod";

const app = express();
app.use(express.json());

// -------------------- ZOD SCHEMAS --------------------

// Body: POST /users
const userCreateSchema = z.object({
  name: z.string().min(1, "name is required").trim(),
  age: z.coerce.number().int().min(0, "age must be >= 0"),
  email: z.string().email("invalid email").optional(),
});

// Body: PATCH /users/:id (allow partial)
const userPatchSchema = userCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Nothing to update" }
);

// Params: /users/:id
const idParamSchema = z.object({
  id: z.coerce.number().int().positive("id must be a positive integer"),
});

// Query: GET /users?page&limit
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// -------------------- ROUTES --------------------

// Health
app.get("/", (_req: Request, res: Response) => {
  res.send("Hello Express + TypeScript!");
});

// Create user
app.post("/users", (req: Request, res: Response) => {
  const parsed = userCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const { name, age, email } = parsed.data;

  const result = db.insert(users).values({ name, age, email }).run();
  // better-sqlite3 returns BigInt for lastInsertRowid; convert to number if safe
  const id = Number(result.lastInsertRowid);

  const created = db.select().from(users).where(eq(users.id, id)).get();
  return res.status(201).json(created);
});

// List users (with simple pagination)
app.get("/users", (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  const all = db.select().from(users).all();
  const items = all.slice(offset, offset + limit);

  res.json({ page, limit, total: all.length, items });
});

// Get user by id
app.get("/users/:id", (req: Request, res: Response) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { id } = parsed.data;

  const row = db.select().from(users).where(eq(users.id, id)).get();
  if (!row) return res.status(404).json({ error: "User not found" });
  res.json(row);
});

// Update user (partial)
app.patch("/users/:id", (req: Request, res: Response) => {
  const idParsed = idParamSchema.safeParse(req.params);
  if (!idParsed.success) {
    return res.status(400).json({ errors: idParsed.error.flatten() });
  }
  const bodyParsed = userPatchSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({ errors: bodyParsed.error.flatten() });
  }

  const { id } = idParsed.data;
  const patch = bodyParsed.data as Partial<{ name: string; age: number; email?: string }>;

  const result = db.update(users).set(patch).where(eq(users.id, id)).run();
  if (result.changes === 0) return res.status(404).json({ error: "User not found" });

  const updated = db.select().from(users).where(eq(users.id, id)).get();
  res.json(updated);
});

// Delete user
app.delete("/users/:id", (req: Request, res: Response) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { id } = parsed.data;

  const result = db.delete(users).where(eq(users.id, id)).run();
  if (result.changes === 0) return res.status(404).json({ error: "User not found" });

  res.status(204).send();
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server http://localhost:${PORT} üzerinde çalışıyor`));
