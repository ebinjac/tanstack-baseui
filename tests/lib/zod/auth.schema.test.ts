import { describe, expect, it } from "vitest";
import { sessionUserSchema, ssoUserSchema } from "@/lib/zod/auth.schema";

// ─── ssoUserSchema ───────────────────────────────────────────────────────────

describe("ssoUserSchema", () => {
  const validSSOUser = {
    attributes: {
      firstName: "John",
      lastName: "Doe",
      fullName: "John Doe",
      adsId: "jdoe001",
      guid: "abc-123-guid",
      employeeId: "E12345",
      email: "john.doe@example.com",
      picture: "https://example.com/photo.jpg",
    },
    groups: ["GROUP_A", "GROUP_B"],
  };

  it("accepts a fully valid SSO user", () => {
    expect(ssoUserSchema.safeParse(validSSOUser).success).toBe(true);
  });

  it("accepts an SSO user without optional picture field", () => {
    const { picture: _pic, ...attrs } = validSSOUser.attributes;
    const input = { ...validSSOUser, attributes: attrs };
    expect(ssoUserSchema.safeParse(input).success).toBe(true);
  });

  it("rejects an empty firstName", () => {
    const input = {
      ...validSSOUser,
      attributes: { ...validSSOUser.attributes, firstName: "" },
    };
    const result = ssoUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const { email: _email, ...attrs } = validSSOUser.attributes;
    const result = ssoUserSchema.safeParse({
      ...validSSOUser,
      attributes: attrs,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email format", () => {
    const input = {
      ...validSSOUser,
      attributes: { ...validSSOUser.attributes, email: "not-an-email" },
    };
    const result = ssoUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid picture URL", () => {
    const input = {
      ...validSSOUser,
      attributes: { ...validSSOUser.attributes, picture: "not-a-url" },
    };
    const result = ssoUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts an empty groups array", () => {
    const input = { ...validSSOUser, groups: [] };
    expect(ssoUserSchema.safeParse(input).success).toBe(true);
  });
});

// ─── sessionUserSchema ────────────────────────────────────────────────────────

describe("sessionUserSchema", () => {
  const validSession = {
    userId: "user-001",
    adsId: "jdoe001",
    email: "john.doe@example.com",
    fullName: "John Doe",
    groups: ["GROUP_A"],
    accessibleTeamIds: ["550e8400-e29b-41d4-a716-446655440000"],
    adminTeamIds: [],
    iat: 1_712_000_000,
    exp: 1_712_003_600,
  };

  it("accepts a fully valid session user", () => {
    expect(sessionUserSchema.safeParse(validSession).success).toBe(true);
  });

  it("rejects an invalid email in session", () => {
    const input = { ...validSession, email: "bad-email" };
    const result = sessionUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects a non-UUID in accessibleTeamIds", () => {
    const input = { ...validSession, accessibleTeamIds: ["not-a-uuid"] };
    const result = sessionUserSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing iat field", () => {
    const { iat: _iat, ...rest } = validSession;
    const result = sessionUserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing exp field", () => {
    const { exp: _exp, ...rest } = validSession;
    const result = sessionUserSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
