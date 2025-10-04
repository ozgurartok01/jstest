import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { ZodError, z } from "zod";

import { db } from "../../utils/db";
import logger from "../../utils/logger";
import { emails } from "../../schemas/schema";
import { loginSchema } from "../../schemas/zodschemas";
import { signAccessToken, verifyPassword } from "../../utils/auth";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const emailRecord = await db.query.emails.findFirst({
      where: eq(emails.email, email),
      with: {
        user: true,
      },
    });

    if (!emailRecord || emailRecord.isDeleted) {
      //should we log here?
      return res.status(401).json({ error: "No such email credentials" });
    }

    const user = emailRecord.user;

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "No such user credentials" });
    }

    //important line for authorization 
    const isMatch = await verifyPassword(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ error: "Wrong password credentials" });
    }

    const token = signAccessToken({ userId: user.id, isAdmin: user.isAdmin });
    const { passwordHash: _, ...userWithoutPassword } = user;

    return res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    logger.error("User login failed", error);
    logger.debug("Login debug info", { error, body: req.body });

    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};
