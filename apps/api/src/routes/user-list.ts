import { db } from "../db";
import { Request, Response} from "express";
import { users } from "../schema";

import {listQuerySchema} from "../zodschemas"

export const list = (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  const all = db.select().from(users).all();
  const items = all.slice(offset, offset + limit);

  res.json({ page, limit, total: all.length, items });
}