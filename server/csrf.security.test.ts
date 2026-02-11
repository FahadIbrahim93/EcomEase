import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(
  role: "user" | "admin" = "user",
  withCsrf: boolean = true
): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "sample-user",
      email: "sample@example.com",
      name: "Sample User",
      loginMethod: "manus",
      role: role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: withCsrf
        ? {
            "x-csrf-token": "test-token",
            cookie: "__Host-csrf=test-token",
          }
        : {},
    } as any,
    res: {} as any,
  };
}

describe("CSRF Protection", () => {
  it("fails when CSRF token is missing for publicProcedure mutation", async () => {
    const ctx = createAuthContext("user", false);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.auth.logout()).rejects.toThrow(
      "CSRF token mismatch or missing"
    );
  });

  it("fails when CSRF token is missing for protectedProcedure mutation", async () => {
    const ctx = createAuthContext("user", false);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.products.create({
        name: "Test Product",
        price: "10.00",
        stockQuantity: 10,
      })
    ).rejects.toThrow("CSRF token mismatch or missing");
  });

  it("fails when CSRF token is missing for adminProcedure mutation", async () => {
    const ctx = createAuthContext("admin", false);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.system.notifyOwner({
        title: "Test",
        content: "Test Content",
      })
    ).rejects.toThrow("CSRF token mismatch or missing");
  });
});
