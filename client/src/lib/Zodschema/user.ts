import z from "zod";

export const UserCreateSchema = z.object({
  name: z.string().min(3, "Name must be at least 2 characters"),
  email: z.string().min(6, "Invalid email!"),
  password: z.string().min(6, "Password must be at least 8 characters"),
});
