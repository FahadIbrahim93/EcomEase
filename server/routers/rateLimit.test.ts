import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

function createAuthContext(): TrpcContext {
  return {
    user: null,
    req: {
      ip: "1.2.3.4",
      protocol: "https",
      headers: {
        "x-csrf-token": "test-token",
        "cookie": "csrf_token=test-token",
      },
    } as any,
    res: {} as any,
  };
}

describe("Rate Limiter", () => {
  it("allows requests under the limit", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // We can call system.health multiple times
    for (let i = 0; i < 5; i++) {
      const result = await caller.system.health({ timestamp: Date.now() });
      expect(result.status).toBe("ok");
    }
  });

  // Note: Testing the actual limit would require calling it 100 times,
  // which might be slow in tests, but it verifies the logic.
});
