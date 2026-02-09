import { randomBytes } from "crypto";
import { Response, Request } from "express";
import { parse as parseCookies } from "cookie";

export const CSRF_HEADER_NAME = "X-CSRF-Token";
export const CSRF_COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-csrf" : "csrf_token";

export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

export function setCsrfToken(res: Response, token: string, isSecure: boolean): void {
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "strict",
    path: "/",
    maxAge: ONE_YEAR_MS,
  });

  res.cookie("XSRF-TOKEN", token, {
    httpOnly: false,
    secure: isSecure,
    sameSite: "strict",
    path: "/",
    maxAge: ONE_YEAR_MS,
  });

  res.setHeader(CSRF_HEADER_NAME, token);
}

export function verifyCsrfToken(req: Request): boolean {
  const headerToken = req.headers[CSRF_HEADER_NAME.toLowerCase()] as string | undefined;
  const cookies = req.cookies || (req.headers.cookie ? parseCookies(req.headers.cookie) : {});
  const cookieToken = cookies[CSRF_COOKIE_NAME];

  return !!headerToken && !!cookieToken && headerToken === cookieToken;
}
