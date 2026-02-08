import { randomBytes } from "crypto";
import { Response, Request } from "express";
import { parse as parseCookie } from "cookie";

const CSRF_HEADER_NAME = "X-CSRF-Token";
export const CSRF_COOKIE_NAME = "__host-csrf";
const XSRF_COOKIE_NAME = "XSRF-TOKEN";

/**
 * Generate a random CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Set CSRF token in response via both cookie and header
 * Cookie is httpOnly, secure, sameSite=strict for storage
 * Header is sent for client to include in mutation requests
 */
export function setCsrfToken(res: Response, token: string, isSecure: boolean): void {
  // HttpOnly cookie to prevent XSS access - used for verification
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "strict",
    path: "/",
    maxAge: 3600000, // 1 hour
  });

  // Non-HttpOnly cookie that client-side JS can read
  res.cookie(XSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: isSecure,
    sameSite: "strict",
    path: "/",
    maxAge: 3600000, // 1 hour
  });

  // Also send in header so client-side JS can read it immediately if needed
  res.setHeader(CSRF_HEADER_NAME, token);
}

/**
 * Verify CSRF token from request
 * On mutations, the client must:
 * 1. Send the token in X-CSRF-Token header (read from XSRF-TOKEN cookie)
 * 2. The server validates that the header-provided token matches the HttpOnly cookie-stored token
 */
export function verifyCsrfToken(req: Request): boolean {
  const headerToken = req.headers[CSRF_HEADER_NAME.toLowerCase()] as string | undefined;

  // Manually parse cookies since cookie-parser middleware is not used
  const cookieHeader = req.headers.cookie;
  const cookies = cookieHeader ? parseCookie(cookieHeader) : {};
  const cookieToken = cookies[CSRF_COOKIE_NAME];

  // Both must exist and match
  if (!headerToken || !cookieToken) {
    return false;
  }

  return headerToken === cookieToken;
}

/**
 * Extract token from request for validation
 */
export function getCsrfTokenFromHeader(req: Request): string | undefined {
  return req.headers[CSRF_HEADER_NAME.toLowerCase()] as string | undefined;
}
