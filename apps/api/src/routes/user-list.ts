import { db } from "../db";
import { Request, Response} from "express";
import { users } from "../schema";
import { sql } from "drizzle-orm";
import { ZodError, z } from "zod";

import {listQuerySchema} from "../zodschemas"

export const list = (req: Request, res: Response) => {
  try {
    const { page, limit } = listQuerySchema.parse(req.query);
    const offset = (page - 1) * limit;

    // Get paginated items with SQL LIMIT/OFFSET
    const items = db.select().from(users).limit(limit).offset(offset).all();
    
    // Get total count for pagination info
    const totalResult = db.select({ count: sql`count(*)` }).from(users).get();
    const total = totalResult?.count || 0;

    res.json({ page, limit, total, items });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}