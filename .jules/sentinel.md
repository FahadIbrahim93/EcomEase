## 2025-05-15 - [CSRF Protection Gap in Protected Procedures]
**Vulnerability:** `protectedProcedure` and `adminProcedure` were missing CSRF protection middleware, even though `publicProcedure` had it.
**Learning:** Chaining procedures from a base procedure is a clean way to ensure global security policies, but if some procedures are built directly from `t.procedure` instead of a secured base, they will miss out on protections.
**Prevention:** Always use a secured base procedure (like `publicProcedure` with CSRF middleware) for all other procedures that require similar protections.
