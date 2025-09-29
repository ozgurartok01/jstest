import { db } from "../../utils/db";
import { Request, Response} from "express"
import { users, emails } from "../../schemas/schema";
import { ZodError, z } from "zod";
import { eq } from "drizzle-orm";
import { createId } from '@paralleldrive/cuid2';

import {userSchema as schema} from "../../schemas/zodschemas"

export const create = async (req: Request, res: Response) => {
  try {
    const { name, age, emails: userEmails } = schema.parse(req.body);

    // Create user with CUID2
    const userId = createId();
    const [createdUser] = await db.insert(users)
      .values({ id: userId, name, age })
      .returning();

    // Create emails with CUID2
    const emailsToInsert = userEmails.map((email: string, index: number) => ({
      id: createId(),
      userId: createdUser.id,
      email,
      isPrimary: index === 0,
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