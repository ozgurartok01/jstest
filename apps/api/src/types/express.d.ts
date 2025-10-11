import { boolean } from "drizzle-orm/gel-core";
import type { AppAbility } from "../utils/define-Ability";

import "express";

declare global {
  namespace Express {
    interface User {
      id: string;
      role?: string;
    }

    interface Request {
      user?: User;
      ability?: AppAbility;
    }
  }
}

export {};
