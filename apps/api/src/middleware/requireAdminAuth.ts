import { NextFunction, Request, Response } from "express";

import logger from "../utils/logger";

export const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!req.user.isAdmin) {
    logger.debug("Forbidden: user lacks admin rights", { userId: req.user.id });
    return res.status(403).json({ error: "Forbidden" });
  }

  return next();
};
