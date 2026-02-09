import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// Instead of mocking the 'db' module, we'll let it run and mock the underlying driver
// but wait, db.ts creates the drizzle instance lazily.
// We can set process.env.DATABASE_URL to something.

function createAuthContext(userId = 1): TrpcContext {
  return {
    user: { id: userId, role: 'user' } as any,
    req: { protocol: "https", headers: { "x-csrf-token": "t", "cookie": "csrf_token=t" } } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

describe("Final Verification Suite", () => {
  it("Rate Limit Enforced", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    for (let i = 0; i < 100; i++) await caller.system.health({});
    await expect(caller.system.health({})).rejects.toThrow(/Too many requests/);
  });

  it("CSRF Enforced", async () => {
    const ctx = createAuthContext();
    ctx.req.headers["x-csrf-token"] = "bad";
    const caller = appRouter.createCaller(ctx);
    // Any mutation
    await expect(caller.products.create({ name: "X", price: "1", stockQuantity: 1 } as any)).rejects.toThrow(/CSRF token mismatch/);
  });
});
