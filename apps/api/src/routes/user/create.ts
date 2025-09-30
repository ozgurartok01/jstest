import { db } from "../../utils/db";
import { Request, Response} from "express"
import { users, emails } from "../../schemas/schema";
import { ZodError, z } from "zod";
import logger from "../../utils/logger";

import {userSchema as schema} from "../../schemas/zodschemas"

export const create = async (req: Request, res: Response) => {
  try {
    const { name, age, emails: userEmails } = schema.parse(req.body);

    // Create user with CUID2
    const [createdUser] = await db.insert(users)
      .values({ name, age })
      .returning();

    // Create emails with CUID2
    const emailsToInsert = userEmails.map((email: string, index: number) => ({
      userId: createdUser.id,
      email,
      isPrimary: index === 0,
    }));

    await db.insert(emails).values(emailsToInsert);

    return res.status(201).json({
      ...createdUser,
      emails: emailsToInsert
    });
  } catch (error) {
    logger.error('User creation failed:', error);
    logger.debug('Debug info:', { error, body: req.body });
    
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}