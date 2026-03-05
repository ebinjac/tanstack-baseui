import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  useAccordionExpand,
  useExpandState,
  useSingleExpand,
} from "@/hooks/use-expand-state";

// ─── useExpandState ───────────────────────────────────────────────────────────

describe("useExpandState", () => {
  const getItemId = (item: { id: string }) => item.id;

  it("starts with no items expanded (default)", () => {
    const { result } = renderHook(() => useExpandState({ getItemId }));
    expect(result.current.expandedIds.size).toBe(0);
    expect(result.current.hasExpanded).toBe(false);
    expect(result.current.expandedCount).toBe(0);
  });

  it("starts with specific items expanded", () => {
    const { result } = renderHook(() =>
      useExpandState({ getItemId, initialExpanded: ["a", "b"] })
    );
    expect(result.current.isExpanded("a")).toBe(true);
    expect(result.current.isExpanded("b")).toBe(true);
    expect(result.current.isExpanded("c")).toBe(false);
    expect(result.current.expandedCount).toBe(2);
  });

  it("toggle expands a collapsed item", () => {
    const { result } = renderHook(() => useExpandState({ getItemId }));

    act(() => {
      result.current.toggle("item-1");
    });

    expect(result.current.isExpanded("item-1")).toBe(true);
    expect(result.current.hasExpanded).toBe(true);
  });

  it("toggle collapses an expanded item", () => {
    const { result } = renderHook(() =>
      useExpandState({ getItemId, initialExpanded: ["item-1"] })
    );

    act(() => {
      result.current.toggle("item-1");
    });

    expect(result.current.isExpanded("item-1")).toBe(false);
    expect(result.current.hasExpanded).toBe(false);
  });

  it("expand adds an item to expandedIds", () => {
    const { result } = renderHook(() => useExpandState({ getItemId }));

    act(() => {
      result.current.expand("item-2");
    });
    expect(result.current.isExpanded("item-2")).toBe(true);
  });

  it("collapse removes an item from expandedIds", () => {
    const { result } = renderHook(() =>
      useExpandState({ getItemId, initialExpanded: ["item-3"] })
    );

    act(() => {
      result.current.collapse("item-3");
    });
    expect(result.current.isExpanded("item-3")).toBe(false);
  });

  it("expandAll expands all given IDs", () => {
    const { result } = renderHook(() => useExpandState({ getItemId }));

    act(() => {
      result.current.expandAll(["a", "b", "c"]);
    });

    expect(result.current.isExpanded("a")).toBe(true);
    expect(result.current.isExpanded("b")).toBe(true);
    expect(result.current.isExpanded("c")).toBe(true);
    expect(result.current.expandedCount).toBe(3);
  });

  it("collapseAll clears all expanded items", () => {
    const { result } = renderHook(() =>
      useExpandState({ getItemId, initialExpanded: ["a", "b", "c"] })
    );

    act(() => {
      result.current.collapseAll();
    });

    expect(result.current.hasExpanded).toBe(false);
    expect(result.current.expandedCount).toBe(0);
  });

  it("setExpanded replaces expanded set directly", () => {
    const { result } = renderHook(() =>
      useExpandState({ getItemId, initialExpanded: ["a", "b"] })
    );

    act(() => {
      result.current.setExpanded(["c", "d"]);
    });

    expect(result.current.isExpanded("a")).toBe(false);
    expect(result.current.isExpanded("c")).toBe(true);
    expect(result.current.isExpanded("d")).toBe(true);
  });

  it("maxExpanded limits the number of expanded items (FIFO)", () => {
    const { result } = renderHook(() =>
      useExpandState({ getItemId, maxExpanded: 2 })
    );

    act(() => {
      result.current.expand("a");
      result.current.expand("b");
      result.current.expand("c"); // should evict "a"
    });

    expect(result.current.expandedCount).toBe(2);
    expect(result.current.isExpanded("a")).toBe(false);
    expect(result.current.isExpanded("b")).toBe(true);
    expect(result.current.isExpanded("c")).toBe(true);
  });
});

// ─── useSingleExpand ──────────────────────────────────────────────────────────

describe("useSingleExpand", () => {
  it("starts collapsed by default", () => {
    const { result } = renderHook(() => useSingleExpand());
    expect(result.current.isExpanded).toBe(false);
  });

  it("starts expanded when given true", () => {
    const { result } = renderHook(() => useSingleExpand(true));
    expect(result.current.isExpanded).toBe(true);
  });

  it("toggle flips the expanded state", () => {
    const { result } = renderHook(() => useSingleExpand());

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isExpanded).toBe(true);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isExpanded).toBe(false);
  });

  it("expand sets to true", () => {
    const { result } = renderHook(() => useSingleExpand());
    act(() => {
      result.current.expand();
    });
    expect(result.current.isExpanded).toBe(true);
  });

  it("collapse sets to false", () => {
    const { result } = renderHook(() => useSingleExpand(true));
    act(() => {
      result.current.collapse();
    });
    expect(result.current.isExpanded).toBe(false);
  });

  it("setExpanded can directly set the value", () => {
    const { result } = renderHook(() => useSingleExpand());
    act(() => {
      result.current.setExpanded(true);
    });
    expect(result.current.isExpanded).toBe(true);
  });
});

// ─── useAccordionExpand ───────────────────────────────────────────────────────

describe("useAccordionExpand", () => {
  it("starts with nothing expanded", () => {
    const { result } = renderHook(() => useAccordionExpand());
    expect(result.current.expandedId).toBeNull();
  });

  it("initializes with a provided id", () => {
    const { result } = renderHook(() => useAccordionExpand("section-1"));
    expect(result.current.expandedId).toBe("section-1");
    expect(result.current.isExpanded("section-1")).toBe(true);
  });

  it("toggle opens a collapsed section", () => {
    const { result } = renderHook(() => useAccordionExpand());
    act(() => {
      result.current.toggle("section-2");
    });
    expect(result.current.expandedId).toBe("section-2");
  });

  it("toggle closes the currently open section", () => {
    const { result } = renderHook(() => useAccordionExpand("section-1"));
    act(() => {
      result.current.toggle("section-1");
    });
    expect(result.current.expandedId).toBeNull();
  });

  it("toggle switches from one section to another", () => {
    const { result } = renderHook(() => useAccordionExpand("section-1"));
    act(() => {
      result.current.toggle("section-2");
    });
    expect(result.current.expandedId).toBe("section-2");
    expect(result.current.isExpanded("section-1")).toBe(false);
    expect(result.current.isExpanded("section-2")).toBe(true);
  });

  it("expand opens a specific section", () => {
    const { result } = renderHook(() => useAccordionExpand());
    act(() => {
      result.current.expand("section-3");
    });
    expect(result.current.expandedId).toBe("section-3");
  });

  it("collapse clears the expanded section", () => {
    const { result } = renderHook(() => useAccordionExpand("section-1"));
    act(() => {
      result.current.collapse();
    });
    expect(result.current.expandedId).toBeNull();
  });
});
