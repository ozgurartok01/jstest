import { db } from "../../utils/db";
import { Request, Response} from "express"
import { users, emails } from "../../schemas/schema";
import { ZodError, z } from "zod";
import { eq } from "drizzle-orm";

import {userSchema as schema} from "../../schemas/zodschemas"

export const create = async (req: Request, res: Response) => {
  try {
    const { name, age, emails: userEmails } = schema.parse(req.body);

    // Create user
    const [createdUser] = await db.insert(users)
      .values({ name, age })
      .returning();

    // Create emails
    const emailsToInsert = userEmails.map((email: string, index: number) => ({
      userId: createdUser.id,
      email,
      isPrimary: index === 0, // First email is primary
    }));

    await db.insert(emails).values(emailsToInsert);

    // Get user with emails
    const userEmails2 = await db.select().from(emails)
      .where(eq(emails.userId, createdUser.id));

    return res.status(201).json({
      ...createdUser,
      emails: userEmails2
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}
