import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { ZodError, z } from "zod";

import { db } from "../../utils/db";
import logger from "../../utils/logger";
import { emails, users } from "../../schemas/schema";
import { userSchema as schema } from "../../schemas/zodschemas";

export const create = async (req: Request, res: Response) => {
  try {
    const { name, age, emails: userEmails, role } = schema.parse(req.body);
    const normalizedEmails = userEmails.map((email) => email.toLowerCase());

    for (const email of normalizedEmails) {
      const existingEmail = await db.query.emails.findFirst({
        where: eq(emails.email, email),
      });

      if (existingEmail && existingEmail.isDeleted === false) {
        return res.status(409).json({ error: "Email already registered" });
      }
    }

    const result = await db.transaction(async (tx) => {
      const createdUser = await tx.insert(users)
        .values({ name, age, role })
        .returning()
        .get();

      const emailsToInsert = normalizedEmails.map((email, index) => ({
        userId: createdUser.id,
        email,
        isPrimary: index === 0,
      }));

      await tx.insert(emails).values(emailsToInsert).run();

      return { createdUser, emails: emailsToInsert };
    });

    const { ...userWithoutPassword } = result.createdUser;

    return res.status(201).json({
      ...userWithoutPassword,
      emails: result.emails,
    });
  } catch (error) {
    logger.error('User creation failed:', error);
    logger.debug('Debug info:', { error, body: req.body });
    
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};
