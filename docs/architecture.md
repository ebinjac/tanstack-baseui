# Architecture Overview

The Ensemble Scorecard application is built on TanStack Start, a full-stack React framework that combines client-side routing, server functions, and SSR capabilities.

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | TanStack Start | Full-stack React framework |
| Routing | TanStack Router | Type-safe routing with file-based routes |
| Data Fetching | TanStack Query | Server state management |
| Database | PostgreSQL + Drizzle ORM | Data persistence |
| UI | shadcn/ui + Base UI | Component library |
| Styling | Tailwind CSS | Utility-first CSS |
| Validation | Zod | Schema validation |
| Auth | iron-session | Session-based authentication |

## Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                        │
├─────────────────────────────────────────────────────────────┤
│  React Components                                            │
│  ├── Routes (TanStack Router)                               │
│  ├── UI Components (shadcn/ui)                              │
│  └── TanStack Query (Client State)                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Server Functions
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Server (Node.js)                       │
├─────────────────────────────────────────────────────────────┤
│  Server Functions                                           │
│  ├── Input Validation (Zod)                                 │
│  ├── Middleware (Auth, Permissions)                         │
│  └── Business Logic                                         │
├─────────────────────────────────────────────────────────────┤
│  Database Layer                                             │
│  ├── Drizzle ORM                                            │
│  └── PostgreSQL                                             │
└─────────────────────────────────────────────────────────────┘
```

## TanStack Start Patterns

### Server Functions

Server functions are defined using `createServerFn` and serve as the API layer:

```typescript
// src/app/actions/scorecard.ts
import { createServerFn } from "@tanstack/react-start";

export const getScorecardData = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => GetScorecardDataSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Server-side logic
    return result;
  });
```

**Key patterns:**
- Use `.middleware()` for authentication and authorization
- Use `.inputValidator()` for Zod schema validation
- Return typed results from handlers

### Router Configuration

The router is configured in `src/router.tsx`:

```typescript
export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 1000 * 60 },
    },
  });

  return createRouter({
    routeTree,
    context: { queryClient, session: null },
  });
};
```

### File-Based Routing

Routes are automatically generated from the `src/routes/` directory. See [`src/routeTree.gen.ts`](src/routeTree.gen.ts) for the generated route tree.

## Data Flow

### Query Flow (Reading Data)

1. Component calls server function via TanStack Query
2. Server function validates input with Zod
3. Middleware checks authentication
4. Handler queries database via Drizzle
5. Results are cached by TanStack Query

### Mutation Flow (Writing Data)

1. User submits form
2. Client calls server function
3. Server validates input
4. Middleware checks permissions
5. Database is updated
6. TanStack Query cache is invalidated
7. UI re-renders with fresh data

## Directory Structure

### `src/app/actions/`

Contains all server functions organized by feature:

- [`scorecard.ts`](src/app/actions/scorecard.ts) - Scorecard CRUD
- [`turnover.ts`](src/app/actions/turnover.ts) - Turnover management
- [`links.ts`](src/app/actions/links.ts) - Link management
- [`teams.ts`](src/app/actions/teams.ts) - Team operations
- [`applications.ts`](src/app/actions/applications.ts) - Application management

### `src/components/`

UI components organized by feature:

- `scorecard/` - Scorecard-specific components
- `turnover/` - Turnover-specific components
- `link-manager/` - Link Manager components
- `shared/` - Reusable components
- `admin/` - Admin dashboard components

### `src/db/schema/`

Database schemas defined with Drizzle ORM:

- `schema.ts` - Core tables (teams, users, applications)
- `turnover.ts` - Turnover-related tables
- `links.ts` - Link management tables

### `src/lib/`

Shared utilities:

- `auth/` - Authentication configuration
- `middleware/` - Route middleware
- `zod/` - Validation schemas

## Authentication Flow

1. User authenticates via SSO or credentials
2. Session is created with iron-session
3. Session data is stored in cookies
4. Router middleware populates session on each request
5. Server functions access session via `context.session`

## Database Schema Patterns

### Core Tables

- **teams** - Team information
- **users** - User accounts
- **applications** - Applications being tracked
- **scorecardEntries** - Sub-applications for scoring
- **scorecardAvailability** - Monthly availability data
- **scorecardVolume** - Monthly volume data
- **turnoverEntries** - Turnover items
- **links** - Saved links

### Common Patterns

- UUID primary keys
- Timestamps (createdAt, updatedAt)
- Soft delete via `deletedAt` column where needed
- Junction tables for many-to-many relationships

## SSR and Hydration

The application uses TanStack Start's SSR capabilities:

- Server renders initial HTML
- Client hydrates React state
- TanStack Query hydrates cached data
- Router enables client-side navigation

## Error Handling

- Server function errors are caught and returned as Error objects
- Client uses error boundaries for graceful failures
- Zod validation errors provide user-friendly messages

## Best Practices

1. **Always validate input** - Use Zod schemas in `.inputValidator()`
2. **Use middleware for auth** - Protect sensitive operations
3. **Return typed results** - Enable TypeScript inference
4. **Invalidate queries after mutations** - Keep UI in sync
5. **Use optimistic updates** - For better UX when appropriate
6. **Keep server functions focused** - Single responsibility
