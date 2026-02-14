## 2025-05-14 - CSRF Protection Bypass in Authenticated Procedures
**Vulnerability:** Authenticated tRPC procedures (`protectedProcedure`, `adminProcedure`) were not inheriting from `publicProcedure`, which meant they bypassed the `csrfMiddleware` defined in `publicProcedure`.
**Learning:** In tRPC, middleware composition matters. Procedures derived directly from `t.procedure` do not inherit middleware from other procedure definitions unless explicitly chained.
**Prevention:** Always derive `protectedProcedure`, `adminProcedure`, and other specialized procedures from `publicProcedure` if `publicProcedure` contains global security middlewares (like CSRF protection, global rate limiting, etc.).
