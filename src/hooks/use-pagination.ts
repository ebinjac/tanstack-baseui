/**
 * usePagination Hook
 *
 * A reusable pagination hook that manages page state and provides
 * computed pagination values. Follows the hook-extract-logic rule
 * from react-best-practices skill.
 *
 * @see skills/react-best-practices/rules/hook-extract-logic.md
 */

import { useState, useMemo, useCallback } from 'react'

export interface UsePaginationOptions {
  /** Total number of items */
  totalItems: number
  /** Items per page (default: 20) */
  pageSize?: number
  /** Initial page number (1-based, default: 1) */
  initialPage?: number
}

export interface UsePaginationReturn {
  /** Current page number (1-based) */
  page: number
  /** Set page directly */
  setPage: (page: number) => void
  /** Total number of pages */
  totalPages: number
  /** Whether there is a next page */
  hasNextPage: boolean
  /** Whether there is a previous page */
  hasPrevPage: boolean
  /** Go to next page */
  nextPage: () => void
  /** Go to previous page */
  prevPage: () => void
  /** Go to first page */
  firstPage: () => void
  /** Go to last page */
  lastPage: () => void
  /** Start index of current page (0-based) */
  startIndex: number
  /** End index of current page (0-based, exclusive) */
  endIndex: number
  /** Current page size (may differ on last page) */
  currentPageSize: number
}

/**
 * Hook for managing pagination state and calculations.
 *
 * @example
 * ```tsx
 * function UserList({ users }: { users: User[] }) {
 *   const pagination = usePagination({ totalItems: users.length, pageSize: 10 })
 *   const paginatedUsers = users.slice(pagination.startIndex, pagination.endIndex)
 *
 *   return (
 *     <div>
 *       {paginatedUsers.map(user => <UserCard key={user.id} user={user} />)}
 *       <PaginationControls {...pagination} />
 *     </div>
 *   )
 * }
 * ```
 */
export function usePagination({
  totalItems,
  pageSize = 20,
  initialPage = 1,
}: UsePaginationOptions): UsePaginationReturn {
  const [page, setPage] = useState(initialPage)

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize))
  }, [totalItems, pageSize])

  // Ensure page is within bounds
  const safePage = useMemo(() => {
    return Math.min(Math.max(1, page), totalPages)
  }, [page, totalPages])

  // Calculate indices
  const startIndex = useMemo(() => {
    return (safePage - 1) * pageSize
  }, [safePage, pageSize])

  const endIndex = useMemo(() => {
    return Math.min(startIndex + pageSize, totalItems)
  }, [startIndex, pageSize, totalItems])

  const currentPageSize = useMemo(() => {
    return endIndex - startIndex
  }, [startIndex, endIndex])

  // Navigation functions
  const nextPage = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages))
  }, [totalPages])

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(p - 1, 1))
  }, [])

  const firstPage = useCallback(() => {
    setPage(1)
  }, [])

  const lastPage = useCallback(() => {
    setPage(totalPages)
  }, [totalPages])

  // Safe page setter that clamps to valid range
  const handleSetPage = useCallback(
    (newPage: number) => {
      setPage(Math.min(Math.max(1, newPage), totalPages))
    },
    [totalPages],
  )

  return {
    page: safePage,
    setPage: handleSetPage,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    startIndex,
    endIndex,
    currentPageSize,
  }
}

/**
 * Hook for paginating an array directly.
 * Returns the paginated slice along with pagination controls.
 *
 * @example
 * ```tsx
 * function UserList({ users }: { users: User[] }) {
 *   const { items, ...pagination } = usePaginatedItems(users, { pageSize: 10 })
 *
 *   return (
 *     <div>
 *       {items.map(user => <UserCard key={user.id} user={user} />)}
 *       <PaginationControls {...pagination} />
 *     </div>
 *   )
 * }
 * ```
 */
export function usePaginatedItems<T>(
  items: T[],
  options?: Omit<UsePaginationOptions, 'totalItems'> & { pageSize?: number },
): UsePaginationReturn & { items: T[] } {
  const pagination = usePagination({
    ...options,
    totalItems: items.length,
  })

  const paginatedItems = useMemo(() => {
    return items.slice(pagination.startIndex, pagination.endIndex)
  }, [items, pagination.startIndex, pagination.endIndex])

  return {
    ...pagination,
    items: paginatedItems,
  }
}
