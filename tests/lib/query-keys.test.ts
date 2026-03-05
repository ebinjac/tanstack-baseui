import { describe, expect, it } from "vitest";
import {
  adminKeys,
  applicationKeys,
  getPermissionInvalidationKeys,
  getTeamQueryKeys,
  linkKeys,
  scorecardKeys,
  teamKeys,
  turnoverKeys,
} from "@/lib/query-keys";

const TEAM_A = "team-a";
const TEAM_B = "team-b";

// ─── scorecardKeys ────────────────────────────────────────────────────────────

describe("scorecardKeys", () => {
  it("all key is a static tuple", () => {
    expect(scorecardKeys.all).toEqual(["scorecard"]);
  });

  it("team key includes teamId", () => {
    expect(scorecardKeys.team(TEAM_A)).toEqual(["scorecard", TEAM_A]);
  });

  it("year key includes teamId and year", () => {
    expect(scorecardKeys.year(TEAM_A, 2024)).toEqual([
      "scorecard",
      TEAM_A,
      2024,
    ]);
  });

  it("different teams produce different keys", () => {
    expect(scorecardKeys.team(TEAM_A)).not.toEqual(scorecardKeys.team(TEAM_B));
  });

  it("different years produce different keys", () => {
    expect(scorecardKeys.year(TEAM_A, 2023)).not.toEqual(
      scorecardKeys.year(TEAM_A, 2024)
    );
  });

  it("publishStatus.all key includes team and 'publish-status'", () => {
    expect(scorecardKeys.publishStatus.all(TEAM_A)).toEqual([
      "scorecard",
      TEAM_A,
      "publish-status",
    ]);
  });

  it("global.all is always the same tuple", () => {
    expect(scorecardKeys.global.all).toEqual(["global-scorecard"]);
  });

  it("global.filtered includes filter object", () => {
    const filters = { year: 2024, leadershipType: "VP" };
    expect(scorecardKeys.global.filtered(filters)).toEqual([
      "global-scorecard",
      filters,
    ]);
  });
});

// ─── turnoverKeys ─────────────────────────────────────────────────────────────

describe("turnoverKeys", () => {
  it("team key starts with 'turnover'", () => {
    const key = turnoverKeys.team(TEAM_A);
    expect(key[0]).toBe("turnover");
    expect(key).toContain(TEAM_A);
  });

  it("entries.all key is a child of team key", () => {
    const teamKey = turnoverKeys.team(TEAM_A);
    const entriesKey = turnoverKeys.entries.all(TEAM_A);
    // entries key should start with team key elements
    expect(entriesKey.slice(0, teamKey.length)).toEqual([...teamKey]);
  });

  it("dispatch key differs from entries key", () => {
    expect(turnoverKeys.dispatch(TEAM_A)).not.toEqual(
      turnoverKeys.entries.all(TEAM_A)
    );
  });

  it("finalized.filtered key includes dateRange, search, and page", () => {
    const dateRange = {
      from: new Date("2024-01-01"),
      to: new Date("2024-03-31"),
    };
    const key = turnoverKeys.finalized.filtered(TEAM_A, dateRange, "search", 2);
    expect(key).toContain(TEAM_A);
    expect(key).toContain("finalized");
    expect(key).toContain(dateRange);
    expect(key).toContain("search");
    expect(key).toContain(2);
  });

  it("metrics key includes dateRange", () => {
    const dateRange = { from: new Date("2024-01-01") };
    const key = turnoverKeys.metrics(TEAM_A, dateRange);
    expect(key).toContain(dateRange);
  });
});

// ─── linkKeys ─────────────────────────────────────────────────────────────────

describe("linkKeys", () => {
  it("all key is ['links']", () => {
    expect(linkKeys.all).toEqual(["links"]);
  });

  it("list key includes teamId and filters", () => {
    const filters = { search: "google", visibility: "public" as const };
    const key = linkKeys.list(TEAM_A, filters);
    expect(key).toContain(TEAM_A);
    expect(key).toContain(filters);
  });

  it("different features produce different root keys", () => {
    expect(linkKeys.all[0]).not.toBe(scorecardKeys.all[0]);
    expect(linkKeys.all[0]).not.toBe(turnoverKeys.all[0]);
  });

  it("categories key differs from stats key for same team", () => {
    expect(linkKeys.categories(TEAM_A)).not.toEqual(linkKeys.stats(TEAM_A));
  });
});

// ─── teamKeys ─────────────────────────────────────────────────────────────────

describe("teamKeys", () => {
  it("list key differs from detail key", () => {
    expect(teamKeys.list()).not.toEqual(teamKeys.detail(TEAM_A));
  });

  it("applications key is scoped under team detail", () => {
    const detailKey = teamKeys.detail(TEAM_A);
    const appsKey = teamKeys.applications(TEAM_A);
    expect(appsKey.slice(0, detailKey.length)).toEqual([...detailKey]);
  });

  it("ldap key includes group name", () => {
    const key = teamKeys.ldap("LDAP_GROUP_ONE");
    expect(key).toContain("LDAP_GROUP_ONE");
    expect(key).toContain("ldap");
  });
});

// ─── adminKeys ────────────────────────────────────────────────────────────────

describe("adminKeys", () => {
  it("all key is ['admin']", () => {
    expect(adminKeys.all).toEqual(["admin"]);
  });

  it("registrationRequests differs from health", () => {
    expect(adminKeys.registrationRequests()).not.toEqual(adminKeys.health());
  });
});

// ─── applicationKeys ──────────────────────────────────────────────────────────

describe("applicationKeys", () => {
  it("team key includes teamId", () => {
    expect(applicationKeys.team(TEAM_A)).toContain(TEAM_A);
  });

  it("search key includes assetId", () => {
    expect(applicationKeys.search(42)).toContain(42);
  });
});

// ─── Helper functions ─────────────────────────────────────────────────────────

describe("getTeamQueryKeys", () => {
  it("returns all expected feature keys", () => {
    const keys = getTeamQueryKeys(TEAM_A);
    expect(keys).toHaveProperty("scorecard");
    expect(keys).toHaveProperty("turnover");
    expect(keys).toHaveProperty("links");
    expect(keys).toHaveProperty("team");
    expect(keys).toHaveProperty("applications");
  });

  it("keys are scoped to the given team", () => {
    const keysA = getTeamQueryKeys(TEAM_A);
    const keysB = getTeamQueryKeys(TEAM_B);
    expect(keysA.scorecard).not.toEqual(keysB.scorecard);
    expect(keysA.turnover).not.toEqual(keysB.turnover);
  });
});

describe("getPermissionInvalidationKeys", () => {
  it("returns an array of query keys", () => {
    const keys = getPermissionInvalidationKeys(TEAM_A);
    expect(Array.isArray(keys)).toBe(true);
    expect(keys.length).toBeGreaterThan(0);
  });

  it("all keys start with a known prefix", () => {
    const keys = getPermissionInvalidationKeys(TEAM_A);
    const knownRoots = ["scorecard", "turnover", "links", "teams"];
    for (const key of keys) {
      expect(knownRoots).toContain(key[0]);
    }
  });
});
