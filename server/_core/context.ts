import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse as parseCookies } from "cookie";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { generateCsrfToken, setCsrfToken } from "./csrf";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const { req, res } = opts;
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Ensure CSRF token is initialized for both authenticated and anonymous users.
  // We check for the httpOnly cookie specifically.
  const cookies =
    req.cookies || (req.headers.cookie ? parseCookies(req.headers.cookie) : {});
  if (!cookies["__Host-csrf"]) {
    const token = generateCsrfToken();
    setCsrfToken(res, token, ENV.isProduction);
  }

  return {
    req,
    res,
    user,
  };
}
