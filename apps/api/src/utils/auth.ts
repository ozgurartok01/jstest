import bcrypt from "bcryptjs";
import jwt, { type JwtPayload as DefaultJwtPayload, type Secret, type SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";

import logger from "./logger";
import { env } from "../config/env";

export interface AccessTokenPayload extends DefaultJwtPayload {
  sub: string;
  role: string;
}

export interface User {
  id: string;
  role?: string;
}

export function signAccessToken(arg: User): string { // no need for this
  const { id, role } = arg;

  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as StringValue,
  };
  return jwt.sign({ sub: id, role }, env.jwtSecret as Secret, options);
}

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, env.jwtSecret as Secret) as AccessTokenPayload;
  } catch (error) {
    logger.debug("Token verification failed", { error });
    throw new Error("Invalid or expired token");
  }
};
