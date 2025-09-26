import { db } from "../db";
import { Request, Response} from "express";
import { users } from "../schema";
import { eq } from "drizzle-orm";

import {userSchema as schema} from "../zodschemas"

export const create   = (req : Request, res : Response) => {
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const { name, age, email } = parsed.data;

  const result = db.insert(users).values({ name, age, email }).run();
  const id = Number(result.lastInsertRowid);

  const created = db.select().from(users).where(eq(users.id, id)).get();
  return res.status(201).json(created);
}