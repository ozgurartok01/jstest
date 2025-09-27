import { db } from "../db";
import { Request, Response} from "express";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import { ZodError, z } from "zod";

import {userPatchSchema as patchSchema, idParamSchema} from "../zodschemas"


export const update = (req: Request, res: Response) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const patch = patchSchema.parse(req.body);

    const result = db.update(users).set(patch).where(eq(users.id, id)).run();
    if (result.changes === 0) return res.status(404).json({ error: "User not found" });

    const updated = db.select().from(users).where(eq(users.id, id)).get();
    res.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}