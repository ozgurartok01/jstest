import { z } from "zod";

const emailField = z
  .email({ message: "invalid email" })
  .transform((value) => value.trim().toLowerCase());

export const userSchema = z.object({
  name: z.string().min(1, "name is required").trim(),
  age: z.coerce.number().int().min(0, "age must be >= 0"),
  emails: z.array(emailField).min(1, "at least one email is required"),
  role: z.enum(["admin", "customer"]),
});

export const userPatchSchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    age: z.coerce.number().int().min(0).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0, //remove if more than one user schema
    { message: "Nothing to update" },
  );

export const loginSchema = z.object({
  email: emailField,
});

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
