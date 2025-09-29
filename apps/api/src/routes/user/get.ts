import { db } from "../../utils/db";
import { Request, Response} from "express";
import { users } from "../../schemas/schema";
import { eq } from "drizzle-orm";
import {idParamSchema} from "../../schemas/zodschemas"
import { ZodError, z } from "zod";

export const get = async (req: Request, res: Response) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const row = await db.select().from(users).where(eq(users.id, id));
    if (!row[0]) return res.status(404).json({ error: "User not found" });
    res.json(row[0]);
 res.status(500).json({ error: "Internal server error" });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}