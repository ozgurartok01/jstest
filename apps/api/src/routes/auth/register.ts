import { Request, Response } from "express";
import { eq } from "drizzle-orm";

import { db } from "../../utils/db";
import logger from "../../utils/logger";
import { emails, users } from "../../schemas/schema";
import { hashPassword, signAccessToken } from "../../utils/auth";
import { userSchema } from "../../schemas/zodschemas";
import { ZodError, z } from "zod";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, age, password, emails: userEmails } = userSchema.parse(req.body);


    //checking existing emails
    for (const email of userEmails) {
      const existingEmail = await db.query.emails.findFirst({
        where: eq(emails.email, email),
      });

      if (existingEmail && existingEmail.isDeleted === false) {
        return res.status(409).json({ error: "Email already registered" });
      }
    }

    const passwordHash = await hashPassword(password);

    
    //inserting created user to db (is atomic)
    const result = db.transaction((tx) => {
      const createdUser = tx.insert(users)
        .values({ name, age, passwordHash })
        .returning()
        .get();

      const emailsToInsert = userEmails.map((email, index) => ({
        userId: createdUser.id,
        email,
        isPrimary: index === 0,
      }));

      tx.insert(emails).values(emailsToInsert).run();

      return { createdUser, emails: emailsToInsert };
    });

    const token = signAccessToken({ userId: result.createdUser.id, isAdmin: result.createdUser.isAdmin });
    const { passwordHash: _, ...userWithoutPassword } = result.createdUser;

    return res.status(201).json({
      token,
      user: {
        userWithoutPassword,
        emails: result.emails,
      },
    });
  } catch (error) {
    logger.error("User registration failed", error);
    logger.debug("Registration debug info", { error, body: req.body });

    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};
