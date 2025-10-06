import { Request, Response } from "express";
import { eq, inArray } from "drizzle-orm";

import { db } from "../../utils/db";
import logger from "../../utils/logger";
import { emails, users } from "../../schemas/schema";
import {signAccessToken } from "../../utils/auth";
import { userSchema } from "../../schemas/zodschemas";
import { ZodError, z } from "zod";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, age, emails: userEmails } = userSchema.parse(req.body);

    //removed password

    //inserting created user to db (is atomic)
    const result = await db.transaction(async (tx) => {
      const existingEmails = await tx.query.emails.findMany({
        where: inArray(emails.email, userEmails),
      });

      if (existingEmails.length > 0) {
        throw new Error("Email already registered");
      }

      const createdUser = await tx
        .insert(users)
        .values({ name, age})
        .returning()
        .get();

      const emailsToInsert = userEmails.map((email, index) => ({
        userId: createdUser.id,
        email,
        isPrimary: index === 0,
      }));

      await tx.insert(emails).values(emailsToInsert).run();

      return { user: createdUser, emails: emailsToInsert };
    });

    const token = signAccessToken( result.user);

    return res.status(201).json({
      token,
      ...result
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
