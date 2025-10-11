import { NextFunction, Request, Response } from "express";

import logger from "../utils/logger";
import { verifyAccessToken } from "../utils/auth";

import defineAbilityFor from "../utils/define-Ability";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication header missing" });
  }

  const token = authHeader.replace("Bearer", "").trim();

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      role: payload.role, //kullanıcı rollerini arrayle tut
    };

    req.ability = defineAbilityFor(req.user);

    return next();
  } catch (error) {
    logger.debug("Authorization failed", { error });
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
