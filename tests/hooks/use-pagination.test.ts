import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePaginatedItems, usePagination } from "@/hooks/use-pagination";

// ─── usePagination ────────────────────────────────────────────────────────────

describe("usePagination", () => {
  it("initializes with page 1 by default", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, pageSize: 10 })
    );
    expect(result.current.page).toBe(1);
  });

  it("initializes with a custom initial page", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, pageSize: 10, initialPage: 3 })
    );
    expect(result.current.page).toBe(3);
  });

  it("calculates totalPages correctly", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 95, pageSize: 10 })
    );
    expect(result.current.totalPages).toBe(10);
  });

  it("totalPages is at least 1 for empty list", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 0, pageSize: 10 })
    );
    expect(result.current.totalPages).toBe(1);
  });

  it("nextPage increments page", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, pageSize: 10 })
    );

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.page).toBe(2);
  });

  it("nextPage does not go past the last page", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 20, pageSize: 10 })
    );

    act(() => {
      result.current.nextPage();
      result.current.nextPage(); // try to go past last
    });

    expect(result.current.page).toBe(2);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("prevPage decrements page", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, pageSize: 10, initialPage: 3 })
    );

    act(() => {
      result.current.prevPage();
    });

    expect(result.current.page).toBe(2);
  });

  it("prevPage does not go below page 1", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, pageSize: 10 })
    );

    act(() => {
      result.current.prevPage();
    });

    expect(result.current.page).toBe(1);
    expect(result.current.hasPrevPage).toBe(false);
  });

  it("firstPage jumps to page 1", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, pageSize: 10, initialPage: 5 })
    );

    act(() => {
      result.current.firstPage();
    });

    expect(result.current.page).toBe(1);
  });

  it("lastPage jumps to the last page", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, pageSize: 10 })
    );

    act(() => {
      result.current.lastPage();
    });

    expect(result.current.page).toBe(10);
  });

  it("setPage clamps to valid range", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, pageSize: 10 })
    );

    act(() => {
      result.current.setPage(99); // beyond last
    });
    expect(result.current.page).toBe(10);

    act(() => {
      result.current.setPage(-5); // below first
    });
    expect(result.current.page).toBe(1);
  });

  it("calculates correct startIndex and endIndex", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 50, pageSize: 10, initialPage: 2 })
    );
    expect(result.current.startIndex).toBe(10);
    expect(result.current.endIndex).toBe(20);
  });

  it("last page endIndex does not exceed totalItems", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 25, pageSize: 10, initialPage: 3 })
    );
    expect(result.current.endIndex).toBe(25);
    expect(result.current.currentPageSize).toBe(5);
  });

  it("hasNextPage and hasPrevPage are correct", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 30, pageSize: 10 })
    );

    expect(result.current.hasPrevPage).toBe(false);
    expect(result.current.hasNextPage).toBe(true);

    act(() => result.current.lastPage());
    expect(result.current.hasPrevPage).toBe(true);
    expect(result.current.hasNextPage).toBe(false);
  });
});

// ─── usePaginatedItems ────────────────────────────────────────────────────────

describe("usePaginatedItems", () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

  it("returns the first page of items by default", () => {
    const { result } = renderHook(() =>
      usePaginatedItems(items, { pageSize: 10 })
    );
    expect(result.current.items).toHaveLength(10);
    expect(result.current.items[0].id).toBe(1);
  });

  it("returns the correct items on next page", () => {
    const { result } = renderHook(() =>
      usePaginatedItems(items, { pageSize: 10 })
    );

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.items).toHaveLength(10);
    expect(result.current.items[0].id).toBe(11);
  });

  it("last page returns remaining items only", () => {
    const { result } = renderHook(() =>
      usePaginatedItems(items, { pageSize: 10 })
    );

    act(() => {
      result.current.lastPage();
    });

    expect(result.current.items).toHaveLength(5);
    expect(result.current.items[0].id).toBe(21);
  });
});
