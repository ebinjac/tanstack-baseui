---
name: react-best-practices
description: Professional-grade React patterns — hooks, component architecture, performance, state management, error boundaries, accessibility, and TypeScript integration. Apply to ALL React code across the project.
---

# React Best Practices

Comprehensive guidelines for writing production-quality React code. These rules enforce patterns used by senior React developers and architects — covering component architecture, custom hooks, performance optimization, state management, and TypeScript integration.

## When to Apply

- Creating or modifying any React component
- Writing or refactoring custom hooks
- Managing state (local, shared, server)
- Handling side effects
- Rendering lists, forms, modals, and conditional UI
- Optimizing renders and bundle size
- Writing TypeScript types for React code
- Implementing error boundaries and loading states

## Rule Categories by Priority

| Priority | Category | Rules | Impact |
|----------|----------|-------|--------|
| CRITICAL | Component Architecture | 6 rules | Maintainable, reusable component design |
| CRITICAL | Custom Hooks | 5 rules | Encapsulated, testable logic |
| CRITICAL | TypeScript | 5 rules | Type-safe props, state, and events |
| HIGH | State Management | 5 rules | Predictable, minimal state |
| HIGH | Performance | 6 rules | Fast renders, small bundles |
| HIGH | Effects & Side Effects | 4 rules | Correct data sync and cleanup |
| MEDIUM | Error Handling | 3 rules | Graceful failures, user trust |
| MEDIUM | Forms & User Input | 3 rules | Validated, accessible forms |
| MEDIUM | Accessibility | 3 rules | Inclusive, standards-compliant UI |
| LOW | Testing Patterns | 3 rules | Confidence in refactoring |
| LOW | File & Naming Conventions | 3 rules | Navigable codebase |

## Quick Reference

### Component Architecture (Prefix: `comp-`)

- `comp-single-responsibility` — One concern per component
- `comp-composition-over-props` — Prefer `children` and slots over prop sprawl
- `comp-container-presentation` — Separate data logic from UI rendering
- `comp-extract-components` — Extract when JSX exceeds ~50 lines or has repeated patterns
- `comp-prop-interface` — Explicit, narrow prop interfaces
- `comp-compound-pattern` — Use compound components for complex widgets

### Custom Hooks (Prefix: `hook-`)

- `hook-extract-logic` — Extract reusable logic into custom hooks
- `hook-naming` — Always prefix with `use`, name by intent
- `hook-single-purpose` — One hook, one responsibility
- `hook-return-shape` — Return consistent `{ data, error, loading }` shapes
- `hook-composition` — Compose hooks from smaller hooks

### TypeScript (Prefix: `tsx-`)

- `tsx-no-any` — Never use `any`; prefer `unknown`, generics, or specific types
- `tsx-prop-types` — Define explicit interfaces for all component props
- `tsx-discriminated-unions` — Use discriminated unions for variant props
- `tsx-event-handlers` — Type event handlers with React event types
- `tsx-generic-components` — Use generics for reusable data-driven components

### State Management (Prefix: `state-`)

- `state-minimal` — Derive values instead of storing redundant state
- `state-colocation` — Keep state as close to usage as possible
- `state-lifting` — Lift state only when siblings need it
- `state-server-state` — Use TanStack Query for server data, not local state
- `state-reducer-pattern` — Use `useReducer` for complex multi-field state

### Performance (Prefix: `perf-`)

- `perf-memo-wisely` — Memoize only when measured, not by default
- `perf-stable-references` — Use `useCallback`/`useMemo` for references passed to children
- `perf-virtualization` — Virtualize lists > 50 items
- `perf-lazy-loading` — Lazy-load routes, modals, and heavy components
- `perf-key-prop` — Use stable, unique keys — never array indices for mutable lists
- `perf-avoid-inline-objects` — Lift static objects/arrays outside render

### Effects & Side Effects (Prefix: `fx-`)

- `fx-cleanup` — Always clean up subscriptions, timers, and listeners
- `fx-dependency-array` — Correct, exhaustive dependency arrays
- `fx-avoid-effects` — Prefer event handlers over `useEffect` for user-triggered actions
- `fx-data-fetching` — Use TanStack Query, not raw `useEffect` + `fetch`

### Error Handling (Prefix: `err-`)

- `err-boundaries` — Wrap feature areas with Error Boundaries
- `err-fallback-ui` — Always provide informative fallback UI
- `err-async-errors` — Handle rejected promises and failed fetches gracefully

### Forms & User Input (Prefix: `form-`)

- `form-controlled-vs-uncontrolled` — Use controlled inputs for validation, uncontrolled for performance
- `form-validation` — Validate with Zod schemas on submit, not on every keystroke
- `form-accessibility` — Associate labels, use `aria-describedby` for errors

### Accessibility (Prefix: `a11y-`)

- `a11y-semantic-html` — Use semantic HTML elements over generic `<div>`
- `a11y-keyboard-navigation` — Ensure all interactive elements are keyboard-accessible
- `a11y-aria-labels` — Provide `aria-label` / `aria-labelledby` for icon-only buttons

### Testing Patterns (Prefix: `test-`)

- `test-behavior` — Test component behavior, not implementation details
- `test-user-events` — Use `userEvent` over `fireEvent`
- `test-custom-hooks` — Test hooks via `renderHook` or through components

### File & Naming Conventions (Prefix: `name-`)

- `name-components` — PascalCase for components, camelCase for hooks
- `name-colocate-files` — Colocate component, hook, types, and styles
- `name-barrel-exports` — Use barrel exports only at feature boundaries

## How to Use

Each rule file in the `rules/` directory contains:
1. **Explanation** — Why this pattern matters
2. **Bad Example** — Anti-pattern to avoid
3. **Good Example** — Recommended implementation
4. **Context** — When to apply or skip this rule

## Full Reference

See individual rule files in `rules/` directory for detailed guidance and code examples.
