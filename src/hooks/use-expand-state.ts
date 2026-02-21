/**
 * useExpandState Hook
 *
 * A reusable hook for managing expand/collapse state across multiple items.
 * Extracts common expand/collapse patterns found in scorecard, turnover, and link manager.
 *
 * @see skills/react-best-practices/rules/hook-extract-logic.md
 */

import { useCallback, useMemo, useState } from 'react'

export interface UseExpandStateOptions<T> {
  /** Unique identifier for each item */
  getItemId: (item: T) => string
  /** Initial expanded state: 'none' | 'all' | string[] of IDs */
  initialExpanded?: 'none' | 'all' | Array<string>
  /** Maximum number of items that can be expanded at once (optional) */
  maxExpanded?: number
}

export interface UseExpandStateReturn {
  /** Set of currently expanded item IDs */
  expandedIds: Set<string>
  /** Check if an item is expanded */
  isExpanded: (id: string) => boolean
  /** Toggle expansion of an item */
  toggle: (id: string) => void
  /** Expand an item */
  expand: (id: string) => void
  /** Collapse an item */
  collapse: (id: string) => void
  /** Expand all items */
  expandAll: (ids: Array<string>) => void
  /** Collapse all items */
  collapseAll: () => void
  /** Set expanded items directly */
  setExpanded: (ids: Array<string>) => void
  /** Whether any items are expanded */
  hasExpanded: boolean
  /** Number of expanded items */
  expandedCount: number
}

/**
 * Hook for managing expand/collapse state of multiple items.
 *
 * @example
 * ```tsx
 * function AccordionList({ items }: { items: AccordionItem[] }) {
 *   const expand = useExpandState({
 *     getItemId: (item) => item.id,
 *     initialExpanded: 'none',
 *   })
 *
 *   return (
 *     <div>
 *       {items.map(item => (
 *         <AccordionItem
 *           key={item.id}
 *           isExpanded={expand.isExpanded(item.id)}
 *           onToggle={() => expand.toggle(item.id)}
 *         />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useExpandState<T>(
  options: UseExpandStateOptions<T>,
): UseExpandStateReturn {
  const { getItemId, initialExpanded = 'none', maxExpanded } = options

  // Initialize expanded set
  const getInitialSet = useCallback(() => {
    if (initialExpanded === 'all') {
      return new Set<string>() // Will be populated on first expandAll
    }
    if (initialExpanded === 'none') {
      return new Set<string>()
    }
    return new Set(initialExpanded)
  }, [initialExpanded])

  const [expandedIds, setExpandedIds] = useState<Set<string>>(getInitialSet)

  // Check if expanded
  const isExpanded = useCallback(
    (id: string) => {
      return expandedIds.has(id)
    },
    [expandedIds],
  )

  // Toggle expansion
  const toggle = useCallback(
    (id: string) => {
      setExpandedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          // Check max constraint
          if (maxExpanded && next.size >= maxExpanded) {
            // Remove first item (FIFO)
            const first = next.values().next().value
            if (first) next.delete(first)
          }
          next.add(id)
        }
        return next
      })
    },
    [maxExpanded],
  )

  // Expand item
  const expand = useCallback(
    (id: string) => {
      setExpandedIds((prev) => {
        if (prev.has(id)) return prev
        const next = new Set(prev)
        if (maxExpanded && next.size >= maxExpanded) {
          const first = next.values().next().value
          if (first) next.delete(first)
        }
        next.add(id)
        return next
      })
    },
    [maxExpanded],
  )

  // Collapse item
  const collapse = useCallback((id: string) => {
    setExpandedIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  // Expand all
  const expandAll = useCallback(
    (ids: Array<string>) => {
      setExpandedIds(() => {
        if (maxExpanded) {
          return new Set(ids.slice(0, maxExpanded))
        }
        return new Set(ids)
      })
    },
    [maxExpanded],
  )

  // Collapse all
  const collapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  // Set expanded directly
  const setExpanded = useCallback((ids: Array<string>) => {
    setExpandedIds(new Set(ids))
  }, [])

  // Computed values
  const hasExpanded = expandedIds.size > 0
  const expandedCount = expandedIds.size

  return {
    expandedIds,
    isExpanded,
    toggle,
    expand,
    collapse,
    expandAll,
    collapseAll,
    setExpanded,
    hasExpanded,
    expandedCount,
  }
}

/**
 * Hook for managing a single expandable section.
 * Simpler alternative when only one item needs to be expanded at a time.
 *
 * @example
 * ```tsx
 * function CollapsiblePanel() {
 *   const { isExpanded, toggle, expand, collapse } = useSingleExpand()
 *
 *   return (
 *     <div>
 *       <button onClick={toggle}>
 *         {isExpanded ? 'Collapse' : 'Expand'}
 *       </button>
 *       {isExpanded && <PanelContent />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useSingleExpand(initialExpanded = false): {
  isExpanded: boolean
  toggle: () => void
  expand: () => void
  collapse: () => void
  setExpanded: (value: boolean) => void
} {
  const [isExpanded, setIsExpanded] = useState(initialExpanded)

  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const expand = useCallback(() => {
    setIsExpanded(true)
  }, [])

  const collapse = useCallback(() => {
    setIsExpanded(false)
  }, [])

  const setExpanded = useCallback((value: boolean) => {
    setIsExpanded(value)
  }, [])

  return {
    isExpanded,
    toggle,
    expand,
    collapse,
    setExpanded,
  }
}

/**
 * Hook for managing accordion-style expansion (only one item expanded at a time).
 *
 * @example
 * ```tsx
 * function Accordion({ items }: { items: AccordionItem[] }) {
 *   const { expandedId, isExpanded, toggle } = useAccordionExpand()
 *
 *   return (
 *     <div>
 *       {items.map(item => (
 *         <AccordionItem
 *           key={item.id}
 *           isExpanded={isExpanded(item.id)}
 *           onToggle={() => toggle(item.id)}
 *         />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useAccordionExpand(initialId?: string): {
  expandedId: string | null
  isExpanded: (id: string) => boolean
  toggle: (id: string) => void
  expand: (id: string) => void
  collapse: () => void
} {
  const [expandedId, setExpandedId] = useState<string | null>(initialId ?? null)

  const isExpanded = useCallback(
    (id: string) => {
      return expandedId === id
    },
    [expandedId],
  )

  const toggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  const expand = useCallback((id: string) => {
    setExpandedId(id)
  }, [])

  const collapse = useCallback(() => {
    setExpandedId(null)
  }, [])

  return {
    expandedId,
    isExpanded,
    toggle,
    expand,
    collapse,
  }
}
