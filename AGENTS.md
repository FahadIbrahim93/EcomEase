# Shopease - AI Agent Guidelines

This document provides essential instructions for AI coder agents working on the Shopease codebase to ensure consistency, security, and quality.

## Core Directives

1. **Always Use TRPCError**: For all server-side errors, use `TRPCError` from `@trpc/server` with appropriate status codes (e.g., `NOT_FOUND`, `FORBIDDEN`, `BAD_REQUEST`). Do not use raw `Error` objects in router logic.
2. **Strict Type Safety**: Avoid using `any`. If a type is unknown, use `unknown` and perform type narrowing. Define specific interfaces for data structures in `shared/types.ts`.
3. **Database Schema**: Follow camelCase for both database column names and property names in `drizzle/schema.ts`. This maintains consistency across the stack.
4. **CSRF Protection**: All mutations MUST go through the `publicProcedure` or its derivatives which include the `csrfMiddleware`. The client must provide the `X-CSRF-Token` header read from the `XSRF-TOKEN` cookie.
5. **Security First**:
   - Validate all user inputs using Zod schemas.
   - Never expose internal database IDs directly if possible (use UUIDs/NanoIDs for public references).
   - Ensure `JWT_SECRET` is never logged or exposed.
6. **Performance**:
   - Always implement pagination (limit/offset) for list endpoints.
   - Add indexes to `drizzle/schema.ts` for any column used in a `WHERE` or `JOIN` clause.

## Project Structure

- `client/`: React + Vite + Tailwind CSS.
- `server/`: Express + tRPC + Drizzle ORM.
- `shared/`: Shared types and constants.
- `drizzle/`: Database schema and migrations.

## Workflow

- Run `pnpm check` to verify types.
- Run `pnpm test` before submitting any changes.
- Ensure `matchMedia` is mocked in any new frontend tests.
