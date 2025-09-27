import { db } from "../db";
import { Request, Response} from "express";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import { ZodError, z } from "zod";

import {userSchema as schema} from "../zodschemas"

export const create = (req: Request, res: Response) => {
  try {
    const { name, age, email } = schema.parse(req.body);

    const result = db.insert(users).values({ name, age, email }).run();
    const id = Number(result.lastInsertRowid);

    const created = db.select().from(users).where(eq(users.id, id)).get();
    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}