# Sentinel Security Journal

## 2025-05-15 - [Missing CSRF protection on authenticated routes]
**Vulnerability:** Authenticated tRPC procedures (`protectedProcedure` and `adminProcedure`) were not inheriting from `publicProcedure`, which contained the `csrfMiddleware`. This left all mutations in these procedures vulnerable to CSRF attacks.
**Learning:** tRPC procedures do not automatically inherit middleware from each other unless explicitly chained. Defining base procedures and extending them is crucial for consistent security.
**Prevention:** Use procedure chaining/inheritance (`publicProcedure.use(...)`) to ensure baseline security middlewares are applied globally. Always verify security assumptions with automated tests that specifically attempt to bypass protections.
