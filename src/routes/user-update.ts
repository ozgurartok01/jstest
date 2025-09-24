import { db } from "../db";
import { Request, Response} from "express";
import { users } from "../schema";
import { eq } from "drizzle-orm";

import {userPatchSchema as patchSchema, idParamSchema} from "../zodschemas"


export const update = (req: Request, res: Response) => {
  const idParsed = idParamSchema.safeParse(req.params);
  if (!idParsed.success) {
    return res.status(400).json({ errors: idParsed.error.flatten() });
  }
  const bodyParsed = patchSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({ errors: bodyParsed.error.flatten() });
  }

  const { id } = idParsed.data;
  const patch = bodyParsed.data as Partial<{ name: string; age: number; email?: string }>;

  const result = db.update(users).set(patch).where(eq(users.id, id)).run();
  if (result.changes === 0) return res.status(404).json({ error: "User not found" });

  const updated = db.select().from(users).where(eq(users.id, id)).get();
  res.json(updated);
}