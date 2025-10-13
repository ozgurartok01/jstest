import { db } from "../../utils/db";
import { Request, Response } from "express";
import { users, emails, posts } from "../../schemas/schema";
import { postSchema } from "../../schemas/zodschemas";
import { ZodError, z } from "zod";
import logger from "../../utils/logger";
import { subject } from "@casl/ability";

export const create = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { content } = postSchema.parse(req.body);

    const reqUser = req.user?.id;

    const createdPost = await db
      .insert(posts)
      .values({ content, userId: reqUser })
      .returning()
      .get();

    return res.status(201).json(createdPost);
  } catch (error) {
    logger.error("Couldnt created a post", error);
    logger.debug("Post debug info", { error, body: req.body });

    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};
