import { db } from "../db";
import { Request, Response} from "express";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import {idParamSchema} from "../zodschemas"
import { ZodError, z } from "zod";

export const _delete = (req: Request, res: Response) => {
  try{
    const { id } = idParamSchema.parse(req.params);
    const result = db.delete(users).where(eq(users.id, id)).run();
    
    if (result.changes === 0) return res.status(404).json({ error: "User not found" });
    res.status(204).send();
  }
  catch (error){
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: z.treeifyError(error) });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}