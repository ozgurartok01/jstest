import bcrypt from "bcryptjs";
import jwt, { type JwtPayload as DefaultJwtPayload, type Secret, type SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";

import logger from "./logger";
import { env } from "../config/env";

export interface AccessTokenPayload extends DefaultJwtPayload {
  sub: string;
  isAdmin: boolean;
}

export interface User {
  id: string;
  isAdmin?: boolean;
}

export function signAccessToken(arg: User): string {
  const { id, isAdmin } = arg;

  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as StringValue,
  };
  return jwt.sign({ sub: id, isAdmin }, env.jwtSecret as Secret, options);
}

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, env.jwtSecret as Secret) as AccessTokenPayload;
  } catch (error) {
    logger.debug("Token verification failed", { error });
    throw new Error("Invalid or expired token");
  }
};
