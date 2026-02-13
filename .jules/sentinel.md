## 2025-05-22 - CSRF Protection via Procedure Inheritance
**Vulnerability:** Authenticated tRPC procedures (`protectedProcedure` and `adminProcedure`) were bypassing CSRF middleware because they were defined using the base `t.procedure` instead of inheriting from `publicProcedure` which contained the `csrfMiddleware`.
**Learning:** In tRPC, middleware inheritance must be explicitly managed. Defining procedures from the base `t.procedure` ignores any middleware applied to other procedures unless they are specifically chained.
**Prevention:** Always use a base `publicProcedure` that includes global security middlewares (like CSRF protection) and ensure all other specialized procedures (e.g., `protected`, `admin`) inherit from it.
