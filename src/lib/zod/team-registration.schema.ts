import { z } from 'zod'

export const TeamRegistrationSchema = z.object({
  teamName: z
    .string()
    .min(3, 'Team name must be at least 3 characters')
    .max(100, 'Team name too long'),
  userGroup: z.string().min(3, 'User group is required').max(100),
  adminGroup: z.string().min(3, 'Admin group is required').max(100),
  contactName: z.string().min(2, 'Contact name is required').max(100),
  contactEmail: z.email('Invalid email address').max(255),
  comments: z.string().optional(),
})

export type TeamRegistrationInput = z.infer<typeof TeamRegistrationSchema>
