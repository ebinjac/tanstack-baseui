import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMultiFilter, useSearchFilter } from "@/hooks/use-search-filter";

interface User {
  email: string;
  id: number;
  name: string;
  role: string;
}

const USERS: User[] = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "admin" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", role: "user" },
  { id: 3, name: "Carol White", email: "carol@example.com", role: "user" },
  { id: 4, name: "Dave Brown", email: "dave@example.com", role: "manager" },
];

// ─── useSearchFilter ──────────────────────────────────────────────────────────

describe("useSearchFilter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns all items when search is empty", () => {
    const { result } = renderHook(() =>
      useSearchFilter({ items: USERS, searchFields: ["name", "email"] })
    );
    expect(result.current.filteredItems).toHaveLength(USERS.length);
  });

  it("filters items by name field", () => {
    const { result } = renderHook(() =>
      useSearchFilter({ items: USERS, searchFields: ["name"] })
    );

    act(() => {
      result.current.setSearchTerm("alice");
    });

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].name).toBe("Alice Johnson");
  });

  it("is case-insensitive", () => {
    const { result } = renderHook(() =>
      useSearchFilter({ items: USERS, searchFields: ["name"] })
    );

    act(() => {
      result.current.setSearchTerm("ALICE");
    });

    expect(result.current.filteredItems).toHaveLength(1);
  });

  it("matches across multiple search fields", () => {
    const { result } = renderHook(() =>
      useSearchFilter({ items: USERS, searchFields: ["name", "email"] })
    );

    act(() => {
      result.current.setSearchTerm("bob@example");
    });

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].name).toBe("Bob Smith");
  });

  it("returns empty array when no items match", () => {
    const { result } = renderHook(() =>
      useSearchFilter({ items: USERS, searchFields: ["name"] })
    );

    act(() => {
      result.current.setSearchTerm("zzz-no-match");
    });

    expect(result.current.filteredItems).toHaveLength(0);
  });

  it("clears search and restores all items", () => {
    const { result } = renderHook(() =>
      useSearchFilter({ items: USERS, searchFields: ["name"] })
    );

    act(() => {
      result.current.setSearchTerm("alice");
    });
    expect(result.current.filteredItems).toHaveLength(1);

    act(() => {
      result.current.clearSearch();
    });
    expect(result.current.filteredItems).toHaveLength(USERS.length);
    expect(result.current.searchTerm).toBe("");
  });

  it("isSearching is true when search term is non-empty", () => {
    const { result } = renderHook(() =>
      useSearchFilter({ items: USERS, searchFields: ["name"] })
    );

    expect(result.current.isSearching).toBe(false);

    act(() => {
      result.current.setSearchTerm("alice");
    });
    expect(result.current.isSearching).toBe(true);
  });

  it("debounces the debouncedSearch value", () => {
    const { result } = renderHook(() =>
      useSearchFilter({
        items: USERS,
        searchFields: ["name"],
        debounceMs: 300,
      })
    );

    act(() => {
      result.current.setSearchTerm("alice");
    });

    // debouncedSearch should not update immediately
    expect(result.current.debouncedSearch).toBe("");

    // After the debounce delay, it should update
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.debouncedSearch).toBe("alice");
  });

  it("uses custom filter function when provided", () => {
    const { result } = renderHook(() =>
      useSearchFilter({
        items: USERS,
        searchFields: ["name"],
        customFilter: (item, term) => item.role === term,
      })
    );

    act(() => {
      result.current.setSearchTerm("admin");
    });

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].name).toBe("Alice Johnson");
  });

  it("initialSearch sets the initial search term", () => {
    const { result } = renderHook(() =>
      useSearchFilter({
        items: USERS,
        searchFields: ["name"],
        initialSearch: "bob",
      })
    );

    expect(result.current.searchTerm).toBe("bob");
    expect(result.current.filteredItems).toHaveLength(1);
  });
});

// ─── useMultiFilter ───────────────────────────────────────────────────────────

describe("useMultiFilter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const initialFilters = { role: "all" };

  const filterFn = (item: User, filters: { role: string }) => {
    if (filters.role === "all") {
      return true;
    }
    return item.role === filters.role;
  };

  it("returns all items with default filters and empty search", () => {
    const { result } = renderHook(() =>
      useMultiFilter({
        items: USERS,
        searchFields: ["name"],
        initialFilters,
        filterFn,
      })
    );
    expect(result.current.filteredItems).toHaveLength(USERS.length);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("filters by a specific role", () => {
    const { result } = renderHook(() =>
      useMultiFilter({
        items: USERS,
        searchFields: ["name"],
        initialFilters,
        filterFn,
      })
    );

    act(() => {
      result.current.setFilter("role", "user");
    });

    expect(result.current.filteredItems).toHaveLength(2);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("combines search and filter", () => {
    const { result } = renderHook(() =>
      useMultiFilter({
        items: USERS,
        searchFields: ["name"],
        initialFilters,
        filterFn,
      })
    );

    act(() => {
      result.current.setFilter("role", "user");
      result.current.setSearchTerm("bob");
    });

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].name).toBe("Bob Smith");
  });

  it("resetFilters restores initial state", () => {
    const { result } = renderHook(() =>
      useMultiFilter({
        items: USERS,
        searchFields: ["name"],
        initialFilters,
        filterFn,
      })
    );

    act(() => {
      result.current.setFilter("role", "admin");
      result.current.setSearchTerm("test");
    });

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters.role).toBe("all");
    expect(result.current.searchTerm).toBe("");
    expect(result.current.hasActiveFilters).toBe(false);
  });
});
