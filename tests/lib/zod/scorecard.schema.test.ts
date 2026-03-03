import { describe, expect, it } from "vitest";
import {
  BulkUpsertScorecardDataSchema,
  CreateScorecardEntrySchema,
  GetPublishStatusSchema,
  PublishScorecardSchema,
  UpdateScorecardEntrySchema,
  UpsertAvailabilitySchema,
  UpsertVolumeSchema,
} from "@/lib/zod/scorecard.schema";

const VALID_APP_ID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_ENTRY_ID = "660e8400-e29b-41d4-a716-446655440001";
const VALID_TEAM_ID = "770e8400-e29b-41d4-a716-446655440002";

// ─── CreateScorecardEntrySchema ───────────────────────────────────────────────

describe("CreateScorecardEntrySchema", () => {
  const validEntry = {
    applicationId: VALID_APP_ID,
    name: "My App Scorecard",
    availabilityThreshold: 99.5,
    volumeChangeThreshold: 10,
  };

  it("accepts a valid scorecard entry", () => {
    expect(CreateScorecardEntrySchema.safeParse(validEntry).success).toBe(true);
  });

  it("accepts an entry with valid identifier", () => {
    const input = { ...validEntry, scorecardIdentifier: "my-app_v2" };
    expect(CreateScorecardEntrySchema.safeParse(input).success).toBe(true);
  });

  it("accepts an empty string identifier (treated as no identifier)", () => {
    const input = { ...validEntry, scorecardIdentifier: "" };
    expect(CreateScorecardEntrySchema.safeParse(input).success).toBe(true);
  });

  it("rejects identifier with special characters", () => {
    const result = CreateScorecardEntrySchema.safeParse({
      ...validEntry,
      scorecardIdentifier: "my app!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects identifier longer than 100 characters", () => {
    const result = CreateScorecardEntrySchema.safeParse({
      ...validEntry,
      scorecardIdentifier: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = CreateScorecardEntrySchema.safeParse({
      ...validEntry,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 255 characters", () => {
    const result = CreateScorecardEntrySchema.safeParse({
      ...validEntry,
      name: "A".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("rejects availabilityThreshold below 0", () => {
    const result = CreateScorecardEntrySchema.safeParse({
      ...validEntry,
      availabilityThreshold: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects availabilityThreshold above 100", () => {
    const result = CreateScorecardEntrySchema.safeParse({
      ...validEntry,
      availabilityThreshold: 101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects volumeChangeThreshold above 100", () => {
    const result = CreateScorecardEntrySchema.safeParse({
      ...validEntry,
      volumeChangeThreshold: 101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid applicationId", () => {
    const result = CreateScorecardEntrySchema.safeParse({
      ...validEntry,
      applicationId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

// ─── UpdateScorecardEntrySchema ───────────────────────────────────────────────

describe("UpdateScorecardEntrySchema", () => {
  it("accepts a valid update with just id", () => {
    const input = { id: VALID_ENTRY_ID };
    expect(UpdateScorecardEntrySchema.safeParse(input).success).toBe(true);
  });

  it("rejects missing id", () => {
    const result = UpdateScorecardEntrySchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(false);
  });

  it("rejects an identifier shorter than 2 characters in update", () => {
    const result = UpdateScorecardEntrySchema.safeParse({
      id: VALID_ENTRY_ID,
      scorecardIdentifier: "x",
    });
    expect(result.success).toBe(false);
  });
});

// ─── UpsertAvailabilitySchema ─────────────────────────────────────────────────

describe("UpsertAvailabilitySchema", () => {
  const validAvailability = {
    scorecardEntryId: VALID_ENTRY_ID,
    year: 2024,
    month: 6,
    availability: 99.9,
  };

  it("accepts valid availability data", () => {
    expect(UpsertAvailabilitySchema.safeParse(validAvailability).success).toBe(
      true
    );
  });

  it("rejects month 0 (months are 1-12)", () => {
    const result = UpsertAvailabilitySchema.safeParse({
      ...validAvailability,
      month: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects month 13 (months are 1-12)", () => {
    const result = UpsertAvailabilitySchema.safeParse({
      ...validAvailability,
      month: 13,
    });
    expect(result.success).toBe(false);
  });

  it("rejects year before 2000", () => {
    const result = UpsertAvailabilitySchema.safeParse({
      ...validAvailability,
      year: 1999,
    });
    expect(result.success).toBe(false);
  });

  it("rejects year after 2100", () => {
    const result = UpsertAvailabilitySchema.safeParse({
      ...validAvailability,
      year: 2101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects availability above 100%", () => {
    const result = UpsertAvailabilitySchema.safeParse({
      ...validAvailability,
      availability: 100.1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects availability below 0%", () => {
    const result = UpsertAvailabilitySchema.safeParse({
      ...validAvailability,
      availability: -0.1,
    });
    expect(result.success).toBe(false);
  });
});

// ─── UpsertVolumeSchema ───────────────────────────────────────────────────────

describe("UpsertVolumeSchema", () => {
  const validVolume = {
    scorecardEntryId: VALID_ENTRY_ID,
    year: 2024,
    month: 3,
    volume: 1500,
  };

  it("accepts valid volume data", () => {
    expect(UpsertVolumeSchema.safeParse(validVolume).success).toBe(true);
  });

  it("rejects negative volume", () => {
    const result = UpsertVolumeSchema.safeParse({
      ...validVolume,
      volume: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts volume of 0 (zero as valid minimum)", () => {
    expect(
      UpsertVolumeSchema.safeParse({ ...validVolume, volume: 0 }).success
    ).toBe(true);
  });
});

// ─── BulkUpsertScorecardDataSchema ────────────────────────────────────────────

describe("BulkUpsertScorecardDataSchema", () => {
  it("accepts an empty bulk upsert", () => {
    expect(BulkUpsertScorecardDataSchema.safeParse({}).success).toBe(true);
  });

  it("accepts bulk with only availability", () => {
    const input = {
      availability: [
        {
          scorecardEntryId: VALID_ENTRY_ID,
          year: 2024,
          month: 1,
          availability: 99,
        },
      ],
    };
    expect(BulkUpsertScorecardDataSchema.safeParse(input).success).toBe(true);
  });
});

// ─── PublishScorecardSchema ───────────────────────────────────────────────────

describe("PublishScorecardSchema", () => {
  const validPublish = { teamId: VALID_TEAM_ID, year: 2024, month: 6 };

  it("accepts a valid publish request", () => {
    expect(PublishScorecardSchema.safeParse(validPublish).success).toBe(true);
  });

  it("rejects an invalid teamId", () => {
    const result = PublishScorecardSchema.safeParse({
      ...validPublish,
      teamId: "bad-id",
    });
    expect(result.success).toBe(false);
  });
});

// ─── GetPublishStatusSchema ───────────────────────────────────────────────────

describe("GetPublishStatusSchema", () => {
  it("accepts valid team + year", () => {
    const input = { teamId: VALID_TEAM_ID, year: 2024 };
    expect(GetPublishStatusSchema.safeParse(input).success).toBe(true);
  });

  it("rejects year out of range", () => {
    const result = GetPublishStatusSchema.safeParse({
      teamId: VALID_TEAM_ID,
      year: 1990,
    });
    expect(result.success).toBe(false);
  });
});
