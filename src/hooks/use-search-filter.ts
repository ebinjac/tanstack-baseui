/**
 * useSearchFilter Hook
 *
 * A reusable search and filter hook with debouncing support.
 * Extracts common search/filter patterns found across multiple components.
 *
 * @see skills/react-best-practices/rules/hook-extract-logic.md
 */

import { useState, useMemo, useEffect, useCallback } from 'react'

export interface UseSearchFilterOptions<T> {
  /** Array of items to filter */
  items: T[]
  /** Fields to search within each item */
  searchFields: (keyof T)[]
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number
  /** Initial search term */
  initialSearch?: string
  /** Custom filter function for additional filtering */
  customFilter?: (item: T, searchTerm: string) => boolean
}

export interface UseSearchFilterReturn<T> {
  /** Current search term input value */
  searchTerm: string
  /** Set search term directly */
  setSearchTerm: (term: string) => void
  /** Debounced search term (for API calls) */
  debouncedSearch: string
  /** Clear search term */
  clearSearch: () => void
  /** Filtered items based on search */
  filteredItems: T[]
  /** Whether any search is active */
  isSearching: boolean
}

/**
 * Hook for filtering items by search term with debouncing.
 *
 * @example
 * ```tsx
 * function UserList({ users }: { users: User[] }) {
 *   const { filteredItems, searchTerm, setSearchTerm, debouncedSearch } = useSearchFilter({
 *     items: users,
 *     searchFields: ['name', 'email'],
 *   })
 *
 *   return (
 *     <div>
 *       <Input
 *         value={searchTerm}
 *         onChange={(e) => setSearchTerm(e.target.value)}
 *         placeholder="Search users..."
 *       />
 *       {filteredItems.map(user => <UserCard key={user.id} user={user} />)}
 *     </div>
 *   )
 * }
 * ```
 */
export function useSearchFilter<T>({
  items,
  searchFields,
  debounceMs = 300,
  initialSearch = '',
  customFilter,
}: UseSearchFilterOptions<T>): UseSearchFilterReturn<T> {
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch)

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [searchTerm, debounceMs])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setDebouncedSearch('')
  }, [])

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return items
    }

    const term = searchTerm.toLowerCase().trim()

    return items.filter((item) => {
      // Use custom filter if provided
      if (customFilter) {
        return customFilter(item, term)
      }

      // Default: search in specified fields
      return searchFields.some((field) => {
        const value = item[field]
        if (value == null) return false
        return String(value).toLowerCase().includes(term)
      })
    })
  }, [items, searchTerm, searchFields, customFilter])

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearch,
    clearSearch,
    filteredItems,
    isSearching: searchTerm.trim().length > 0,
  }
}

/**
 * Hook for filtering with multiple filter criteria.
 * Supports both search and additional filters.
 *
 * @example
 * ```tsx
 * function ProductList({ products }: { products: Product[] }) {
 *   const { filteredItems, filters, setFilter, searchTerm, setSearchTerm } = useMultiFilter({
 *     items: products,
 *     searchFields: ['name', 'description'],
 *     initialFilters: { category: 'all', inStock: true },
 *     filterFn: (product, filters) => {
 *       if (filters.category !== 'all' && product.category !== filters.category) return false
 *       if (filters.inStock && !product.inStock) return false
 *       return true
 *     },
 *   })
 * }
 * ```
 */
export interface UseMultiFilterOptions<T, F extends Record<string, unknown>> {
  /** Array of items to filter */
  items: T[]
  /** Fields to search within each item */
  searchFields: (keyof T)[]
  /** Initial filter state */
  initialFilters: F
  /** Filter function for applying filters */
  filterFn: (item: T, filters: F) => boolean
  /** Debounce delay in milliseconds */
  debounceMs?: number
}

export interface UseMultiFilterReturn<T, F extends Record<string, unknown>> {
  /** Filtered items */
  filteredItems: T[]
  /** Current filter state */
  filters: F
  /** Set a specific filter value */
  setFilter: <K extends keyof F>(key: K, value: F[K]) => void
  /** Set all filters at once */
  setFilters: (filters: F) => void
  /** Reset filters to initial state */
  resetFilters: () => void
  /** Search term */
  searchTerm: string
  /** Set search term */
  setSearchTerm: (term: string) => void
  /** Debounced search term */
  debouncedSearch: string
  /** Whether any filters are active */
  hasActiveFilters: boolean
}

export function useMultiFilter<T, F extends Record<string, unknown>>({
  items,
  searchFields,
  initialFilters,
  filterFn,
  debounceMs = 300,
}: UseMultiFilterOptions<T, F>): UseMultiFilterReturn<T, F> {
  const [filters, setFilters] = useState<F>(initialFilters)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [searchTerm, debounceMs])

  // Set individual filter
  const setFilter = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
    setSearchTerm('')
    setDebouncedSearch('')
  }, [initialFilters])

  // Filter items
  const filteredItems = useMemo(() => {
    let result = items

    // Apply search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter((item) => {
        return searchFields.some((field) => {
          const value = item[field]
          if (value == null) return false
          return String(value).toLowerCase().includes(term)
        })
      })
    }

    // Apply filters
    result = result.filter((item) => filterFn(item, filters))

    return result
  }, [items, searchTerm, searchFields, filters, filterFn])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    const hasSearch = searchTerm.trim().length > 0
    const hasFilters = Object.entries(initialFilters).some(([key, value]) => {
      return filters[key as keyof F] !== value
    })
    return hasSearch || hasFilters
  }, [searchTerm, filters, initialFilters])

  return {
    filteredItems,
    filters,
    setFilter,
    setFilters,
    resetFilters,
    searchTerm,
    setSearchTerm,
    debouncedSearch,
    hasActiveFilters,
  }
}
