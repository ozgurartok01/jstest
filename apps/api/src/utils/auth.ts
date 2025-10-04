import bcrypt from "bcryptjs";
import jwt, { type JwtPayload as DefaultJwtPayload, type Secret, type SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";

import logger from "./logger";
import { env } from "../config/env";

export interface AccessTokenPayload extends DefaultJwtPayload {
  sub: string;
  isAdmin: boolean;
}

export interface AccessTokenClaims {
  userId: string;
  isAdmin?: boolean;
}

export const hashPassword = async (password: string) => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const verifyPassword = (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};


export function signAccessToken(arg: string | AccessTokenClaims): string {
  const { userId, isAdmin = false } =
    typeof arg === "string" ? { userId: arg, isAdmin: false } : arg;

  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as StringValue,
  };
  return jwt.sign({ sub: userId, isAdmin }, env.jwtSecret as Secret, options);
}

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, env.jwtSecret as Secret) as AccessTokenPayload;
  } catch (error) {
    logger.debug("Token verification failed", { error });
    throw new Error("Invalid or expired token");
  }
};
