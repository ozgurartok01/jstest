import { db } from "../db";
import { Request, Response} from "express";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import {idParamSchema} from "../zodschemas"

export const get = (req: Request, res: Response) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { id } = parsed.data;

  const row = db.select().from(users).where(eq(users.id, id)).get();
  if (!row) return res.status(404).json({ error: "User not found" });
  res.json(row);
}