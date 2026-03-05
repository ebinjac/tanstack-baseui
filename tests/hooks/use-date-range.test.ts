import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  useDateRange,
  useMonthYearSelection,
  useYearSelection,
} from "@/hooks/use-date-range";

// ─── useDateRange ─────────────────────────────────────────────────────────────

describe("useDateRange", () => {
  it("starts with no range when no initial values given", () => {
    const { result } = renderHook(() => useDateRange());
    expect(result.current.range).toBeNull();
    expect(result.current.hasRange).toBe(false);
    expect(result.current.displayValue).toBe("Select date range");
  });

  it("initializes with a preset", () => {
    const { result } = renderHook(() =>
      useDateRange({ initialPreset: "thisMonth" })
    );
    expect(result.current.hasRange).toBe(true);
    expect(result.current.preset).toBe("thisMonth");
    expect(result.current.displayValue).toBe("This Month");
  });

  it("initializes with an explicit range", () => {
    const start = new Date("2024-01-01");
    const end = new Date("2024-01-31");
    const { result } = renderHook(() =>
      useDateRange({ initialRange: { start, end } })
    );
    expect(result.current.hasRange).toBe(true);
    expect(result.current.preset).toBeNull();
    expect(result.current.range?.start).toEqual(start);
    expect(result.current.range?.end).toEqual(end);
  });

  it("setRange updates the range and clears preset", () => {
    const { result } = renderHook(() =>
      useDateRange({ initialPreset: "thisMonth" })
    );
    const newRange = {
      start: new Date("2024-06-01"),
      end: new Date("2024-06-30"),
    };

    act(() => {
      result.current.setRange(newRange);
    });

    expect(result.current.range).toEqual(newRange);
    expect(result.current.preset).toBeNull();
  });

  it("clearRange removes range and preset", () => {
    const { result } = renderHook(() =>
      useDateRange({ initialPreset: "lastMonth" })
    );

    act(() => {
      result.current.clearRange();
    });

    expect(result.current.range).toBeNull();
    expect(result.current.preset).toBeNull();
    expect(result.current.hasRange).toBe(false);
  });

  it("setPreset updates range and preset label", () => {
    const { result } = renderHook(() => useDateRange());

    act(() => {
      result.current.setPreset("lastYear");
    });

    expect(result.current.preset).toBe("lastYear");
    expect(result.current.displayValue).toBe("Last Year");
    expect(result.current.hasRange).toBe(true);
  });

  it("setStart auto-adjusts end if end is before new start", () => {
    const { result } = renderHook(() =>
      useDateRange({
        initialRange: {
          start: new Date("2024-01-01"),
          end: new Date("2024-01-15"),
        },
      })
    );

    act(() => {
      result.current.setStart(new Date("2024-01-20")); // beyond current end
    });

    // end should be bumped to equal new start
    expect(result.current.range?.start).toEqual(new Date("2024-01-20"));
    expect(result.current.range?.end).toEqual(new Date("2024-01-20"));
  });

  it("daysInRange returns correct count", () => {
    const { result } = renderHook(() =>
      useDateRange({
        initialRange: {
          start: new Date("2024-01-01"),
          end: new Date("2024-01-10"),
        },
      })
    );
    expect(result.current.daysInRange).toBe(10); // inclusive
  });

  it("daysInRange is 0 when no range", () => {
    const { result } = renderHook(() => useDateRange());
    expect(result.current.daysInRange).toBe(0);
  });

  it("isInRange returns true for dates within range", () => {
    const { result } = renderHook(() =>
      useDateRange({
        initialRange: {
          start: new Date("2024-03-01"),
          end: new Date("2024-03-31"),
        },
      })
    );
    expect(result.current.isInRange(new Date("2024-03-15"))).toBe(true);
    expect(result.current.isInRange(new Date("2024-04-01"))).toBe(false);
  });

  it("canSetStart respects minDate", () => {
    const minDate = new Date("2024-01-01");
    const { result } = renderHook(() => useDateRange({ minDate }));
    expect(result.current.canSetStart(new Date("2023-12-31"))).toBe(false);
    expect(result.current.canSetStart(new Date("2024-02-01"))).toBe(true);
  });

  it("canSetEnd respects maxDate", () => {
    const maxDate = new Date("2024-12-31");
    const { result } = renderHook(() => useDateRange({ maxDate }));
    expect(result.current.canSetEnd(new Date("2025-01-01"))).toBe(false);
    expect(result.current.canSetEnd(new Date("2024-06-15"))).toBe(true);
  });
});

// ─── useYearSelection ─────────────────────────────────────────────────────────

describe("useYearSelection", () => {
  it("defaults to current year", () => {
    const { result } = renderHook(() => useYearSelection());
    expect(result.current.year).toBe(new Date().getFullYear());
  });

  it("nextYear increments the year", () => {
    const { result } = renderHook(() =>
      useYearSelection({ initialYear: 2024 })
    );

    act(() => {
      result.current.nextYear();
    });
    expect(result.current.year).toBe(2025);
  });

  it("prevYear decrements the year", () => {
    const { result } = renderHook(() =>
      useYearSelection({ initialYear: 2024 })
    );

    act(() => {
      result.current.prevYear();
    });
    expect(result.current.year).toBe(2023);
  });

  it("nextYear does not go past maxYear", () => {
    const { result } = renderHook(() =>
      useYearSelection({ initialYear: 2024, maxYear: 2024 })
    );

    act(() => {
      result.current.nextYear();
    });
    expect(result.current.year).toBe(2024);
    expect(result.current.hasNextYear).toBe(false);
  });

  it("setYear respects min/max bounds", () => {
    const { result } = renderHook(() =>
      useYearSelection({ initialYear: 2024, minYear: 2020, maxYear: 2030 })
    );

    act(() => {
      result.current.setYear(2015); // below min
    });
    expect(result.current.year).toBe(2024); // unchanged

    act(() => {
      result.current.setYear(2027); // valid
    });
    expect(result.current.year).toBe(2027);
  });

  it("years array is in descending order", () => {
    const { result } = renderHook(() =>
      useYearSelection({ minYear: 2020, maxYear: 2023 })
    );
    expect(result.current.years).toEqual([2023, 2022, 2021, 2020]);
  });
});

// ─── useMonthYearSelection ────────────────────────────────────────────────────

describe("useMonthYearSelection", () => {
  it("initializes with provided month and year", () => {
    const { result } = renderHook(() =>
      useMonthYearSelection({ initialMonth: 5, initialYear: 2024 })
    );
    expect(result.current.month).toBe(5);
    expect(result.current.year).toBe(2024);
  });

  it("nextMonth increments month, wraps to next year in December", () => {
    const { result } = renderHook(() =>
      useMonthYearSelection({ initialMonth: 11, initialYear: 2024 })
    );

    act(() => {
      result.current.nextMonth();
    });

    expect(result.current.month).toBe(0);
    expect(result.current.year).toBe(2025);
  });

  it("prevMonth decrements month, wraps to prev year in January", () => {
    const { result } = renderHook(() =>
      useMonthYearSelection({ initialMonth: 0, initialYear: 2024 })
    );

    act(() => {
      result.current.prevMonth();
    });

    expect(result.current.month).toBe(11);
    expect(result.current.year).toBe(2023);
  });

  it("setMonth rejects values outside 0-11", () => {
    const { result } = renderHook(() =>
      useMonthYearSelection({ initialMonth: 5 })
    );

    act(() => {
      result.current.setMonth(12);
    });
    expect(result.current.month).toBe(5); // unchanged
  });

  it("displayValue formats correctly", () => {
    const { result } = renderHook(() =>
      useMonthYearSelection({ initialMonth: 0, initialYear: 2024 })
    );
    expect(result.current.displayValue).toBe("January 2024");
  });
});
