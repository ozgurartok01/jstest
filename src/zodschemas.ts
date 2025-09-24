import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(1, "name is required").trim(),
  age: z.coerce.number().int().min(0, "age must be >= 0"),
  email: z.string().email("invalid email").optional(),
});

export const userPatchSchema = userSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Nothing to update" }
);

// Params: /users/:id
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("id must be a positive integer"),
});


// Query: GET /users?page&limit
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
