## 2025-05-15 - [CSRF Protection Gap in tRPC Procedures]

**Vulnerability:** `protectedProcedure` and `adminProcedure` were missing CSRF protection because they did not inherit from `publicProcedure` which contained the CSRF middleware.
**Learning:** In tRPC, security middlewares should be attached to a base procedure that all other procedures extend to ensure consistent enforcement.
**Prevention:** Always extend a hardened `publicProcedure` for all authenticated and administrative procedures. Added a regression test `server/csrf.security.test.ts` to verify CSRF protection across all procedure levels.
