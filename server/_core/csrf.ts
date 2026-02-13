import { randomBytes } from "crypto";
import { Response, Request } from "express";
import { parse as parseCookies } from "cookie";

const CSRF_HEADER_NAME = "X-CSRF-Token";
const CSRF_COOKIE_NAME = "__Host-csrf";

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
export function setCsrfToken(
  res: Response,
  token: string,
  isSecure: boolean
): void {
  // 1 year in milliseconds to match session duration
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

  // HttpOnly cookie for server-side verification (secure storage)
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "strict",
    path: "/",
    maxAge: ONE_YEAR_MS,
  });

  // Non-HttpOnly cookie so client-side can read it and send it back in a header
  res.cookie("XSRF-TOKEN", token, {
    httpOnly: false,
    secure: isSecure,
    sameSite: "strict",
    path: "/",
    maxAge: ONE_YEAR_MS,
  });

  // Also send in header for the current request
  res.setHeader(CSRF_HEADER_NAME, token);
}

/**
 * Verify CSRF token from request
 * On mutations, the client must:
 * 1. Send the token in X-CSRF-Token header (from the response header)
 * 2. The server validates that the header-provided token matches the cookie-stored token
 */
export function verifyCsrfToken(req: Request): boolean {
  const headerToken = req.headers[CSRF_HEADER_NAME.toLowerCase()] as
    | string
    | undefined;

  // Fallback to manual cookie parsing if cookie-parser middleware is not used
  const cookies =
    req.cookies || (req.headers.cookie ? parseCookies(req.headers.cookie) : {});
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
