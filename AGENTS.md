# Shopease - AI Agent Guidelines

This document provides essential instructions for AI coder agents working on the Shopease codebase to ensure consistency, security, and quality.

## Core Directives

1. **Always Use TRPCError**: For all server-side errors, use `TRPCError` from `@trpc/server` with appropriate status codes (e.g., `NOT_FOUND`, `FORBIDDEN`, `BAD_REQUEST`). Do not use raw `Error` objects in router logic.
2. **Strict Type Safety**: Avoid using `any`. If a type is unknown, use `unknown` and perform type narrowing. Define specific interfaces for data structures in `shared/types.ts`.
3. **Database Schema**: Follow camelCase for both database column names and property names in `drizzle/schema.ts`.
4. **CSRF Protection**: All mutations MUST go through the `publicProcedure` or its derivatives. The client must provide the `X-CSRF-Token` header.
5. **Observability**: Use the `logger` utility from `server/_core/logger.ts` instead of `console.log`. Log levels must be appropriate (`debug` for noise, `info` for events, `warn` for non-critical issues, `error` for failures).
6. **Performance**:
   - Always implement pagination (limit/offset) for list endpoints.
   - Use SQL aggregations for dashboard-style summaries instead of in-memory calculations.
7. **Domain Routing**: When adding new features, create a new router file in `server/routers/` and register it in `server/routers.ts`.

## Project Structure

- `client/`: React + Vite + Tailwind CSS.
- `server/`: Express + tRPC + Drizzle ORM.
  - `routers/`: Domain-specific API logic.
  - `_core/`: Shared infrastructure logic.
- `shared/`: Shared types and constants.
- `drizzle/`: Database schema and migrations.

## Workflow Invariants

- **Zero Slop**: No TODOs, no ellipses, no stubs in PRs.
- **Integration Testing**: Prefer integration tests that exercise the real database (using `drizzle` with a local/in-memory instance if possible).
- **Security Check**: Run `pnpm audit --audit-level high` before submission.
