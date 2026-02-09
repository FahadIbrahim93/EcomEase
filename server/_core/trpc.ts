import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { verifyCsrfToken } from "./csrf";
import { logger } from "./logger";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const middleware = t.middleware;

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;
const requestCounts = new Map<string, { count: number; resetTime: number }>();

if (process.env.NODE_ENV !== "test") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of requestCounts.entries()) {
      if (now > entry.resetTime) requestCounts.delete(key);
    }
  }, WINDOW_MS).unref();
}

export const rateLimitMiddleware = t.middleware(async ({ ctx, next, path }) => {
  const ip = ctx.req.ip || ctx.req.headers["x-forwarded-for"] || "unknown";
  const key = `${ip}:${path}`;
  const now = Date.now();

  let entry = requestCounts.get(key);
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + WINDOW_MS };
    requestCounts.set(key, entry);
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    logger.warn("Rate limit exceeded", { ip, path, count: entry.count });
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many requests" });
  }

  return next();
});

const csrfMiddleware = t.middleware(async ({ ctx, next, type }) => {
  if (type === "mutation" && !verifyCsrfToken(ctx.req)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "CSRF token mismatch" });
  }
  return next();
});

export const publicProcedure = t.procedure
  .use(rateLimitMiddleware)
  .use(csrfMiddleware);

const requireUser = t.middleware(async opts => {
  if (!opts.ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return opts.next({
    ctx: { ...opts.ctx, user: opts.ctx.user },
  });
});

export const protectedProcedure = publicProcedure.use(requireUser);

export const adminProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    if (!opts.ctx.user || opts.ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return opts.next();
  }),
);
