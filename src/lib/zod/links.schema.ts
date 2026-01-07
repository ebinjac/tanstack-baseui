
import { z } from "zod";

export const LinkVisibilitySchema = z.enum(["private", "public"]);

export const CreateLinkSchema = z.object({
    title: z.string().min(1, "Title is required"),
    url: z.string().url("Must be a valid URL"),
    description: z.string().optional(),
    visibility: LinkVisibilitySchema.default("private"),
    applicationId: z.string().uuid().or(z.literal("")).or(z.literal("none")).nullish(),
    categoryId: z.string().uuid().or(z.literal("")).or(z.literal("none")).nullish(),
    tags: z.array(z.string()).optional(),
    teamId: z.string().uuid(),
    // userEmail will be inferred from session in the server action
});

export const UpdateLinkSchema = CreateLinkSchema.partial().extend({
    id: z.string().uuid(),
});

export const BulkCreateLinkSchema = z.object({
    teamId: z.string().uuid(),
    links: z.array(CreateLinkSchema.omit({ teamId: true })),
});
