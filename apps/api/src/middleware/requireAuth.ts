import { NextFunction, Request, Response } from "express";

import logger from "../utils/logger";
import { verifyAccessToken } from "../utils/auth";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication header missing" });
  }

  const token = authHeader.replace("Bearer", "").trim();

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      isAdmin: payload.isAdmin,
    };

    //console.log(req.user.id);

    return next();
  } catch (error) {
    logger.debug("Authorization failed", { error });
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
