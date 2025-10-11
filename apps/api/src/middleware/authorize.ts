// authorize.ts
import { subject } from "@casl/ability";
import defineAbilityFor from "../utils/define-Ability";

import { NextFunction, Request, Response } from "express";

type SubjectBuilder = (req: Request) => any;

export const authorize =
  (action: string, subjectName: string, buildSubject?: SubjectBuilder) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const ability = req.ability ?? defineAbilityFor(req.user);
    const resource = buildSubject
      ? subject(subjectName, buildSubject(req))
      : subjectName;

    if (!ability.can(action, resource)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.ability = ability; // keep it around for downstream handlers
    return next();
  };
