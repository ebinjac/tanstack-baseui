import { z } from "zod";

export const UpdateTeamSchema = z.object({
  id: z.uuid(),
  teamName: z
    .string()
    .min(3, "Team name must be at least 3 characters")
    .max(100),
  userGroup: z.string().min(3, "User group is required").max(100),
  adminGroup: z.string().min(3, "Admin group is required").max(100),
  contactName: z.string().min(2, "Contact name is required").max(100),
  contactEmail: z.email("Invalid email address").max(255),
  isActive: z.boolean(),
});

export type UpdateTeamInput = z.infer<typeof UpdateTeamSchema>;
