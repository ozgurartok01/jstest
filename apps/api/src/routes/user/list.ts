import { db } from "../../utils/db";
import { Request, Response} from "express";
import { users } from "../../schemas/schema";
import { sql } from "drizzle-orm";
import { ZodError, z } from "zod";

import {listQuerySchema} from "../../schemas/zodschemas"

export const list = async (req: Request, res: Response) => {
  try {
    const { page, limit } = listQuerySchema.parse(req.query);
    const offset = (page - 1) * limit;

    // Get paginated items with SQL LIMIT/OFFSET
    const items = await db.select().from(users).limit(limit).offset(offset);
    
    // Get total count for pagination info
    const totalResult = await db.select({ count: sql`count(*)` }).from(users);
    const total = totalResult[0]?.count || 0;

    res.json({ page, limit, total, items });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}