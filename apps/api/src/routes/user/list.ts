import { Request, Response } from "express";
import { eq, count } from "drizzle-orm";
import { ZodError, z } from "zod";

import { db } from "../../utils/db";
import logger from "../../utils/logger";
import { users, emails } from "../../schemas/schema";
import { listQuerySchema } from "../../schemas/zodschemas";

export const list = async (req: Request, res: Response) => {
  try {
    const { page, limit } = listQuerySchema.parse(req.query);
    const offset = (page - 1) * limit;

    const usersList = await db.query.users.findMany({
      limit,
      offset,
      with: {
        emails: {
          where: eq(emails.isDeleted, false),
          columns: {
            email: true,
            isPrimary: true,
          },
        },
      },
    });
    
    const totalResult = await db.select({ count: count() }).from(users);
    const total = totalResult[0]?.count || 0;

    const sanitizedUsers = usersList.map(({ passwordHash, ...rest }) => rest);

    res.json({ page, limit, total, items: sanitizedUsers });
  } catch (error) {
    logger.error('User list failed:', error);
    logger.debug('Debug info:', { error, query: req.query });
    
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};
