import { describe, expect, it } from "vitest";
import { CreateTurnoverEntrySchema } from "@/lib/zod/turnover.schema";

const BASE_RFC = {
  teamId: "550e8400-e29b-41d4-a716-446655440000",
  applicationId: "660e8400-e29b-41d4-a716-446655440001",
  section: "RFC" as const,
  rfcNumber: "RFC-001",
  rfcStatus: "Approved" as const,
  validatedBy: "John Doe",
};

const BASE_INC = {
  teamId: "550e8400-e29b-41d4-a716-446655440000",
  applicationId: "660e8400-e29b-41d4-a716-446655440001",
  section: "INC" as const,
  incidentNumber: "INC-12345",
};

const BASE_MIM = {
  teamId: "550e8400-e29b-41d4-a716-446655440000",
  applicationId: "660e8400-e29b-41d4-a716-446655440001",
  section: "MIM" as const,
  mimLink: "https://mim.example.com/report",
};

const BASE_COMMS = {
  teamId: "550e8400-e29b-41d4-a716-446655440000",
  applicationId: "660e8400-e29b-41d4-a716-446655440001",
  section: "COMMS" as const,
  emailSubject: "Important communication",
};

const BASE_FYI = {
  teamId: "550e8400-e29b-41d4-a716-446655440000",
  applicationId: "660e8400-e29b-41d4-a716-446655440001",
  section: "FYI" as const,
  description: "Some important context.",
};

const BASE_ALERTS = {
  teamId: "550e8400-e29b-41d4-a716-446655440000",
  applicationId: "660e8400-e29b-41d4-a716-446655440001",
  section: "ALERTS" as const,
  title: "High CPU Alert",
};

// ─── RFC section ──────────────────────────────────────────────────────────────

describe("CreateTurnoverEntrySchema — RFC section", () => {
  it("accepts a valid RFC entry", () => {
    expect(CreateTurnoverEntrySchema.safeParse(BASE_RFC).success).toBe(true);
  });

  it("rejects RFC entry missing rfcNumber", () => {
    const { rfcNumber: _n, ...rest } = BASE_RFC;
    const result = CreateTurnoverEntrySchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("rfcNumber");
    }
  });

  it("rejects RFC entry missing rfcStatus", () => {
    const { rfcStatus: _s, ...rest } = BASE_RFC;
    const result = CreateTurnoverEntrySchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("rfcStatus");
    }
  });

  it("rejects RFC entry missing validatedBy", () => {
    const { validatedBy: _v, ...rest } = BASE_RFC;
    const result = CreateTurnoverEntrySchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("validatedBy");
    }
  });

  it("rejects an unknown rfcStatus", () => {
    const result = CreateTurnoverEntrySchema.safeParse({
      ...BASE_RFC,
      rfcStatus: "Unknown Status",
    });
    expect(result.success).toBe(false);
  });
});

// ─── INC section ──────────────────────────────────────────────────────────────

describe("CreateTurnoverEntrySchema — INC section", () => {
  it("accepts a valid INC entry", () => {
    expect(CreateTurnoverEntrySchema.safeParse(BASE_INC).success).toBe(true);
  });

  it("rejects INC entry missing incidentNumber", () => {
    const { incidentNumber: _n, ...rest } = BASE_INC;
    const result = CreateTurnoverEntrySchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("incidentNumber");
    }
  });
});

// ─── MIM section ──────────────────────────────────────────────────────────────

describe("CreateTurnoverEntrySchema — MIM section", () => {
  it("accepts a valid MIM entry", () => {
    expect(CreateTurnoverEntrySchema.safeParse(BASE_MIM).success).toBe(true);
  });

  it("accepts MIM entry with optional slack link", () => {
    const input = {
      ...BASE_MIM,
      mimSlackLink: "https://slack.example.com/link",
    };
    expect(CreateTurnoverEntrySchema.safeParse(input).success).toBe(true);
  });

  it("rejects MIM entry missing mimLink", () => {
    const { mimLink: _l, ...rest } = BASE_MIM;
    const result = CreateTurnoverEntrySchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("mimLink");
    }
  });
});

// ─── COMMS section ────────────────────────────────────────────────────────────

describe("CreateTurnoverEntrySchema — COMMS section", () => {
  it("accepts COMMS entry with emailSubject", () => {
    expect(CreateTurnoverEntrySchema.safeParse(BASE_COMMS).success).toBe(true);
  });

  it("accepts COMMS entry with slackLink only", () => {
    const input = {
      ...BASE_COMMS,
      emailSubject: undefined,
      slackLink: "https://slack.example.com/channel",
    };
    expect(CreateTurnoverEntrySchema.safeParse(input).success).toBe(true);
  });

  it("rejects COMMS entry with neither emailSubject nor slackLink", () => {
    const input = {
      teamId: BASE_COMMS.teamId,
      applicationId: BASE_COMMS.applicationId,
      section: "COMMS" as const,
    };
    const result = CreateTurnoverEntrySchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("emailSubject");
    }
  });
});

// ─── FYI section ──────────────────────────────────────────────────────────────

describe("CreateTurnoverEntrySchema — FYI section", () => {
  it("accepts a valid FYI entry", () => {
    expect(CreateTurnoverEntrySchema.safeParse(BASE_FYI).success).toBe(true);
  });

  it("rejects FYI entry with no description", () => {
    const input = {
      teamId: BASE_FYI.teamId,
      applicationId: BASE_FYI.applicationId,
      section: "FYI" as const,
    };
    const result = CreateTurnoverEntrySchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("description");
    }
  });
});

// ─── ALERTS section ───────────────────────────────────────────────────────────

describe("CreateTurnoverEntrySchema — ALERTS section", () => {
  it("accepts a valid ALERTS entry", () => {
    expect(CreateTurnoverEntrySchema.safeParse(BASE_ALERTS).success).toBe(true);
  });

  it("accepts ALERTS entry without a title (title is optional)", () => {
    const { title: _t, ...rest } = BASE_ALERTS;
    // ALERTS has no cross-field validation — should accept without title
    expect(CreateTurnoverEntrySchema.safeParse(rest).success).toBe(true);
  });
});

// ─── Base field validations ───────────────────────────────────────────────────

describe("CreateTurnoverEntrySchema — base field validation", () => {
  it("rejects an invalid teamId (non-UUID)", () => {
    const result = CreateTurnoverEntrySchema.safeParse({
      ...BASE_INC,
      teamId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid applicationId (non-UUID)", () => {
    const result = CreateTurnoverEntrySchema.safeParse({
      ...BASE_INC,
      applicationId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown section value", () => {
    const result = CreateTurnoverEntrySchema.safeParse({
      ...BASE_INC,
      section: "UNKNOWN",
    });
    expect(result.success).toBe(false);
  });

  it("title is limited to 255 characters", () => {
    const longTitle = "A".repeat(256);
    const result = CreateTurnoverEntrySchema.safeParse({
      ...BASE_ALERTS,
      title: longTitle,
    });
    expect(result.success).toBe(false);
  });
});
