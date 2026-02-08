## 2025-05-15 - [CSRF Protection Gap in tRPC]
**Vulnerability:** The application had utility functions for CSRF token generation and validation, but they were not wired into the tRPC middleware or the client-side API calls, leaving all mutations vulnerable to CSRF.
**Learning:** Even if security utilities exist in the codebase, they might not be actively protecting the application if they aren't integrated into the core request lifecycle. In this repo, the transition from Express to tRPC left a gap where CSRF was expected but not implemented.
**Prevention:** Always verify that security middlewares are applied to the base procedure in tRPC and that the client-side configuration includes the necessary headers for all mutation requests.
