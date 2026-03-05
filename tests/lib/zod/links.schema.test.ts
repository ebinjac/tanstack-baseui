import { describe, expect, it } from "vitest";
import {
  BulkCreateLinkSchema,
  CreateLinkSchema,
  UpdateLinkSchema,
} from "@/lib/zod/links.schema";

const VALID_TEAM_ID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_CATEGORY_ID = "660e8400-e29b-41d4-a716-446655440001";

// ─── CreateLinkSchema ─────────────────────────────────────────────────────────

describe("CreateLinkSchema", () => {
  const validLink = {
    title: "Google",
    url: "https://google.com",
    visibility: "public" as const,
    teamId: VALID_TEAM_ID,
  };

  it("accepts a minimal valid link", () => {
    expect(CreateLinkSchema.safeParse(validLink).success).toBe(true);
  });

  it("accepts a link with all optional fields", () => {
    const input = {
      ...validLink,
      description: "Search engine",
      applicationId: VALID_CATEGORY_ID,
      categoryId: VALID_CATEGORY_ID,
      tags: ["search", "tools"],
    };
    expect(CreateLinkSchema.safeParse(input).success).toBe(true);
  });

  it("accepts 'none' as applicationId", () => {
    const input = { ...validLink, applicationId: "none" };
    expect(CreateLinkSchema.safeParse(input).success).toBe(true);
  });

  it("accepts empty string as categoryId", () => {
    const input = { ...validLink, categoryId: "" };
    expect(CreateLinkSchema.safeParse(input).success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = CreateLinkSchema.safeParse({ ...validLink, title: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("title");
    }
  });

  it("rejects an invalid URL", () => {
    const result = CreateLinkSchema.safeParse({
      ...validLink,
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("url");
    }
  });

  it("rejects an invalid visibility value", () => {
    const result = CreateLinkSchema.safeParse({
      ...validLink,
      visibility: "unknown",
    });
    expect(result.success).toBe(false);
  });

  it("rejects 'private' visibility as valid", () => {
    const input = { ...validLink, visibility: "private" as const };
    expect(CreateLinkSchema.safeParse(input).success).toBe(true);
  });

  it("rejects an invalid teamId (non-uuid)", () => {
    const result = CreateLinkSchema.safeParse({
      ...validLink,
      teamId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing teamId", () => {
    const { teamId: _id, ...rest } = validLink;
    const result = CreateLinkSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ─── UpdateLinkSchema ─────────────────────────────────────────────────────────

describe("UpdateLinkSchema", () => {
  const VALID_LINK_ID = "770e8400-e29b-41d4-a716-446655440002";

  it("accepts a minimal update with just id", () => {
    const input = {
      id: VALID_LINK_ID,
      teamId: VALID_TEAM_ID,
      title: "Updated Title",
    };
    expect(UpdateLinkSchema.safeParse(input).success).toBe(true);
  });

  it("requires a valid UUID for id", () => {
    const result = UpdateLinkSchema.safeParse({
      id: "not-a-uuid",
      title: "New title",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing id", () => {
    const result = UpdateLinkSchema.safeParse({ title: "New title" });
    expect(result.success).toBe(false);
  });

  it("accepts partial updates (all fields optional except id)", () => {
    const input = { id: VALID_LINK_ID, title: "Only title update" };
    expect(UpdateLinkSchema.safeParse(input).success).toBe(true);
  });
});

// ─── BulkCreateLinkSchema ─────────────────────────────────────────────────────

describe("BulkCreateLinkSchema", () => {
  it("accepts a valid bulk create request", () => {
    const input = {
      teamId: VALID_TEAM_ID,
      links: [
        { title: "Link A", url: "https://a.com", visibility: "public" },
        { title: "Link B", url: "https://b.com", visibility: "private" },
      ],
    };
    expect(BulkCreateLinkSchema.safeParse(input).success).toBe(true);
  });

  it("accepts an empty links array", () => {
    const input = { teamId: VALID_TEAM_ID, links: [] };
    expect(BulkCreateLinkSchema.safeParse(input).success).toBe(true);
  });

  it("rejects a link in the array with invalid URL", () => {
    const input = {
      teamId: VALID_TEAM_ID,
      links: [{ title: "Bad", url: "not-url", visibility: "public" }],
    };
    const result = BulkCreateLinkSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
