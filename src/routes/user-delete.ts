import { db } from "../db";
import { Request, Response} from "express";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import {idParamSchema} from "../zodschemas"

export const _delete = (req: Request, res: Response) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { id } = parsed.data;

  const result = db.delete(users).where(eq(users.id, id)).run();
  if (result.changes === 0) return res.status(404).json({ error: "User not found" });

  res.status(204).send();
}