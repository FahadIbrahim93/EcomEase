import { describe, expect, it, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

function createUnsafeContext(): TrpcContext {
  return {
    user: { id: 1, role: 'user' } as any,
    req: {
      protocol: "https",
      headers: {
        // Missing CSRF token
      },
    } as any,
    res: {} as any,
  };
}

describe("CSRF Protection Middleware", () => {
  it("rejects mutations without CSRF token", async () => {
    const ctx = createUnsafeContext();
    const caller = appRouter.createCaller(ctx);

    // products.create is a mutation
    await expect(caller.products.create({
      name: "Should Fail",
      price: "10.00",
      stockQuantity: 1
    })).rejects.toThrow(/CSRF token mismatch or missing/);
  });

  it("allows queries without CSRF token", async () => {
    const ctx = createUnsafeContext();
    const caller = appRouter.createCaller(ctx);

    // system.health is a query
    const result = await caller.system.health({ timestamp: Date.now() });
    expect(result.status).toBe("ok");
  });
});
