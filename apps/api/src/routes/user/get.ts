import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { ZodError, z } from "zod";

import { db } from "../../utils/db";
import logger from "../../utils/logger";
import { users, emails } from "../../schemas/schema";
import { idParamSchema } from "../../schemas/zodschemas";

export const get = async (req: Request, res: Response) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const canSeeEmails = req.ability?.can("read", "Email") ?? false;

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        emails: {
          where: eq(emails.isDeleted, false),
          columns: {
            email: canSeeEmails,
            isPrimary: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (error) {
    logger.error("User get failed:", error);
    logger.debug("Debug info:", { error, params: req.params });

    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};
