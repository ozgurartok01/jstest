import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { ZodError, z } from "zod";

import { db } from "../../utils/db";
import logger from "../../utils/logger";
import { emails } from "../../schemas/schema";
import { loginSchema } from "../../schemas/zodschemas";
import { signAccessToken } from "../../utils/auth";

export const login = async (req: Request, res: Response) => {
  try {
    const { email } = loginSchema.parse(req.body);

    const emailRecord = await db.query.emails.findFirst({
      where: eq(emails.email, email),
      with: {
        user: true,
      },
    });

    if (!emailRecord) {
      //remove
      //should we log here?
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = emailRecord.user;

    if (!user) {
      //exception
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signAccessToken(user); //user object pass

    return res.json({
      token,
      user,
    });
  } catch (error) {
    logger.debug("User login failed", { error, body: req.body });

    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};
