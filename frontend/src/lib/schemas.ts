import { z } from "zod";
export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional().default(""),
});
export type ProjectInput = z.infer<typeof projectSchema>;
