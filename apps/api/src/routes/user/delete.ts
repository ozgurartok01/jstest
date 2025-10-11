import { db } from "../../utils/db";
import { Request, Response } from "express";
import { users, emails } from "../../schemas/schema";
import { eq } from "drizzle-orm";
import { idParamSchema } from "../../schemas/zodschemas";
import { ZodError, object, z } from "zod";
import logger from "../../utils/logger";
import { subject } from "@casl/ability";

export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const ability = req.ability?.can("delete", subject("User", { id }));
    if (!ability) return res.status(403).json({ error: "Forbidden" });
    // Delete emails first (hard delete to avoid FK constraint)
    await db.delete(emails).where(eq(emails.userId, id)).run();

    // Delete user
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning()
      .get();

    return res.status(200).json({ deletedUser: result });
  } catch (error) {
    logger.error("User delete failed:", error);
    logger.debug("Debug info:", { error, params: req.params });

    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};
