import express from "express";
import { Request, Response, NextFunction } from "express";

import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

const app = express();
app.use(express.json());

// --- Health
app.get("/", (_req: Request, res: Response) => {
  res.send("Hello Express + TypeScript!");
});

// --- USERS CRUD ---

// Create user
app.post("/users", (req: Request, res: Response) => {
  const { name, age, email } = req.body ?? {};
  if (typeof name !== "string" || typeof age !== "number") {
    return res.status(400).json({ error: "Invalid body. Expected { name: string, age: number }" });
  }

  const result = db.insert(users).values({ name, age, email }).run();
  // result.lastInsertRowid is a BigInt in better-sqlite3; convert to number
  const id = Number(result.lastInsertRowid);

  const created = db.select().from(users).where(eq(users.id, id)).get();
  return res.status(201).json(created);
});

// List users (with simple pagination)
app.get("/users", (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.max(1, Math.min(100, Number(req.query.limit ?? 10)));
  const offset = (page - 1) * limit;

  // For SQLite + Drizzle + better-sqlite3, use raw SQL for limit/offset if needed,
  // but simplest is to fetch all and slice for demo purposes:
  const all = db.select().from(users).all();
  const items = all.slice(offset, offset + limit);

  res.json({ page, limit, total: all.length, items });
});

// Get user by id
app.get("/users/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const row = db.select().from(users).where(eq(users.id, id)).get();
  if (!row) return res.status(404).json({ error: "User not found" });
  res.json(row);
});

// Update user (partial)
app.patch("/users/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const { name, age } = req.body ?? {};
  const patch: Partial<{ name: string; age: number }> = {};
  if (name !== undefined) {
    if (typeof name !== "string") return res.status(400).json({ error: "name must be string" });
    patch.name = name;
  }
  if (age !== undefined) {
    if (typeof age !== "number") return res.status(400).json({ error: "age must be number" });
    patch.age = age;
  }
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const result = db.update(users).set(patch).where(eq(users.id, id)).run();
  if (result.changes === 0) return res.status(404).json({ error: "User not found" });

  const updated = db.select().from(users).where(eq(users.id, id)).get();
  res.json(updated);
});

// Delete user
app.delete("/users/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const result = db.delete(users).where(eq(users.id, id)).run();
  if (result.changes === 0) return res.status(404).json({ error: "User not found" });

  res.status(204).send();
});

// --- 404
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// --- Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server http://localhost:${PORT} üzerinde çalışıyor`));
