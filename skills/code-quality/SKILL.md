---
name: code-quality
description: Professional code quality standards — DRY, naming, error handling, file structure, type safety, code smells, and refactoring patterns. Apply to ALL code across the project for architect-level quality.
---

# Code Quality Standards

Professional-grade quality standards enforced across the entire codebase. These rules embody the practices of senior engineers and architects — clean code, strong types, consistent patterns, and ruthless elimination of code smells.

## When to Apply

- Writing any new code (components, hooks, utilities, server functions)
- Reviewing or refactoring existing code
- Adding error handling or validation
- Naming functions, variables, files, and types
- Organizing files and modules
- Making architectural decisions about code structure

## Rule Categories by Priority

| Priority | Category | Rules | Impact |
|----------|----------|-------|--------|
| CRITICAL | DRY & Abstraction | 4 rules | Eliminates duplication, reduces maintenance |
| CRITICAL | Error Handling | 4 rules | Robust, debuggable, user-friendly |
| CRITICAL | Type Safety | 4 rules | Prevents bugs at compile time |
| HIGH | Naming & Readability | 5 rules | Self-documenting code |
| HIGH | Function Design | 4 rules | Small, focused, testable functions |
| HIGH | Code Smells | 5 rules | Identifies and prevents anti-patterns |
| MEDIUM | File Organization | 4 rules | Navigable, scalable codebase |
| MEDIUM | Constants & Config | 3 rules | No magic values, central config |
| LOW | Comments & Docs | 3 rules | Meaningful comments, not noise |
| LOW | Git Hygiene | 2 rules | Clean commits, traceable changes |

## Quick Reference

### DRY & Abstraction (Prefix: `dry-`)

- `dry-no-copy-paste` — Extract duplicated blocks into functions or hooks
- `dry-shared-schemas` — Define Zod schemas once, import everywhere
- `dry-utility-functions` — Create typed utilities for repeated operations
- `dry-component-patterns` — Create base components for repeated UI patterns

### Error Handling (Prefix: `err-`)

- `err-typed-errors` — Use `unknown` in catch, narrow with `instanceof`
- `err-user-facing-messages` — Show helpful messages, log technical details
- `err-fail-fast` — Validate inputs early, throw specific errors
- `err-exhaustive-handling` — Handle all branches of discriminated unions

### Type Safety (Prefix: `type-`)

- `type-no-any` — Zero tolerance for `any` (see react-best-practices/tsx-no-any)
- `type-infer-from-schemas` — Derive types from Zod schemas with `z.infer`
- `type-discriminated-unions` — Model state variants as unions, not optional fields
- `type-branded-types` — Use branded types for IDs to prevent mixing

### Naming & Readability (Prefix: `name-`)

- `name-intention-revealing` — Names describe purpose, not implementation
- `name-boolean-predicates` — Prefix booleans with `is`, `has`, `can`, `should`
- `name-consistent-vocabulary` — One word per concept project-wide
- `name-avoid-abbreviations` — Full words except well-known acronyms
- `name-function-verbs` — Functions start with verbs: `get`, `create`, `update`, `delete`, `handle`, `validate`

### Function Design (Prefix: `fn-`)

- `fn-small-focused` — Functions under 30 lines, one level of abstraction
- `fn-limited-params` — Max 3 parameters; use an options object for more
- `fn-early-return` — Guard clauses first, happy path unindented
- `fn-pure-when-possible` — Prefer pure functions, isolate side effects

### Code Smells (Prefix: `smell-`)

- `smell-long-files` — Files over 300 lines should be split
- `smell-deep-nesting` — Max 3 levels of indentation; extract and return early
- `smell-boolean-params` — Replace boolean params with named options or separate functions
- `smell-primitive-obsession` — Group related primitives into typed objects
- `smell-shotgun-surgery` — If one change touches many files, consolidate the logic

### File Organization (Prefix: `file-`)

- `file-feature-folders` — Group by feature, not by type
- `file-colocation` — Keep related code close together
- `file-index-exports` — Use index files at feature boundaries only
- `file-single-export-focus` — One primary export per file

### Constants & Config (Prefix: `const-`)

- `const-no-magic-values` — Extract magic numbers and strings into named constants
- `const-enums-over-strings` — Use `as const` objects or enums for fixed sets
- `const-central-config` — Centralize configuration values

### Comments & Docs (Prefix: `doc-`)

- `doc-why-not-what` — Comments explain WHY, code explains WHAT
- `doc-jsdoc-public` — JSDoc on exported functions and complex hooks
- `doc-no-commented-code` — Delete commented-out code; it lives in git

### Git Hygiene (Prefix: `git-`)

- `git-atomic-commits` — One logical change per commit
- `git-meaningful-messages` — Describe the WHY, not just the WHAT

## How to Use

Each rule file in the `rules/` directory contains:
1. **Explanation** — Why this pattern matters
2. **Bad Example** — Anti-pattern to avoid
3. **Good Example** — Recommended implementation
4. **Context** — When to apply or skip this rule

## Full Reference

See individual rule files in `rules/` directory for detailed guidance and code examples.
