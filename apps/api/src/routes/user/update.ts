import { db } from "../../utils/db";
import { Request, Response} from "express";
import { users } from "../../schemas/schema";
import { eq } from "drizzle-orm";
import { ZodError, z } from "zod";

import {userPatchSchema as patchSchema, idParamSchema} from "../../schemas/zodschemas"

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const patch = patchSchema.parse(req.body);

    const [updated] = await db.update(users)
      .set(patch)
      .where(eq(users.id, id))
      .returning();
      
    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}