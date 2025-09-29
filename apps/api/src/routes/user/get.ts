import { db } from "../../utils/db";
import { Request, Response} from "express";
import { users, emails } from "../../schemas/schema";
import { eq } from "drizzle-orm";
import {idParamSchema} from "../../schemas/zodschemas"
import { ZodError, z } from "zod";

export const get = async (req: Request, res: Response) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const user = await db.select().from(users).where(eq(users.id, id));
    if (!user[0]) return res.status(404).json({ error: "User not found" });

    const userEmails = await db.select().from(emails)
      .where(eq(emails.userId, id));

    res.json({
      ...user[0],
      emails: userEmails
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}