import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(1, "name is required").trim(),
  age: z.coerce.number().int().min(0, "age must be >= 0"),
  emails: z.array(z.string().email("invalid email")).min(1, "at least one email is required"),
});

export const userPatchSchema = z.object({
  name: z.string().min(1).trim().optional(),
  age: z.coerce.number().int().min(0).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Nothing to update" }
);

// Params: /users/:id
export const idParamSchema = z.object({
  id: z.string().cuid2("Invalid ID format"),
});

// Query: GET /users?page&limit
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// Email operations
export const emailSchema = z.object({
  email: z.string().email("invalid email"),
  isPrimary: z.boolean().default(false),
});

export const addEmailSchema = z.object({
  email: z.string().email("invalid email"),
  isPrimary: z.boolean().default(false),
});