import { z } from "zod";

export const ssoUserSchema = z.object({
  attributes: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    fullName: z.string().min(1),
    adsId: z.string().min(1),
    guid: z.string().min(1),
    employeeId: z.string().min(1),
    email: z.email(),
    picture: z.url().optional(),
  }),
  groups: z.array(z.string()),
});

export const sessionUserSchema = z.object({
  userId: z.string(),
  adsId: z.string(),
  email: z.email(),
  fullName: z.string(),
  groups: z.array(z.string()),
  accessibleTeamIds: z.array(z.uuid()),
  adminTeamIds: z.array(z.uuid()),
  iat: z.number(), // issued at
  exp: z.number(), // expiration
});

export type SSOUser = z.infer<typeof ssoUserSchema>;
export type SessionUser = z.infer<typeof sessionUserSchema>;
