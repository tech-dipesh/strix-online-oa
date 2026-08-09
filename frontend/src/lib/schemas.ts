import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional().default(""),
});

export const aiProviderSchema = z.object({
  label: z.string().min(1, "Give this provider a name").max(50),
  base_url: z.url("Enter a valid base URL"),
  api_key: z.string().max(500).optional().default(""),
  model_name: z.string().min(1, "Model name is required").max(100),
});

export type AIProviderInput = z.infer<typeof aiProviderSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
