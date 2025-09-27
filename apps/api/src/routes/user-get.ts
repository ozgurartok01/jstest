import { db } from "../db";
import { Request, Response} from "express";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import {idParamSchema} from "../zodschemas"
import { ZodError, z } from "zod";

export const get = (req: Request, res: Response) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const row = db.select().from(users).where(eq(users.id, id)).get();
    if (!row) return res.status(404).json({ error: "User not found" });
    res.json(row);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}