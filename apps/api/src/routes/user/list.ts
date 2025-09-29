import { db } from "../../utils/db";
import { Request, Response} from "express";
import { users, emails } from "../../schemas/schema";
import { sql, eq } from "drizzle-orm";
import { ZodError, z } from "zod";

import {listQuerySchema} from "../../schemas/zodschemas"

export const list = async (req: Request, res: Response) => {
  try {
    const { page, limit } = listQuerySchema.parse(req.query);
    const offset = (page - 1) * limit;

    // Get paginated users
    const usersList = await db.select().from(users).limit(limit).offset(offset);
    
    // Get total count for pagination info
    const totalResult = await db.select({ count: sql`count(*)` }).from(users);
    const total = totalResult[0]?.count || 0;

    // Get emails for each user
    const usersWithEmails = await Promise.all(
      usersList.map(async (user) => {
        const userEmails = await db.select().from(emails)
          .where(eq(emails.userId, user.id));
        return {
          ...user,
          emails: userEmails
        };
      })
    );

    res.json({ page, limit, total, items: usersWithEmails });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}