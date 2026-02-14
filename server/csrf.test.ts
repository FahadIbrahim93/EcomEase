import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(withCsrf = false): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: withCsrf ? {
        "x-csrf-token": "test-token",
        "cookie": "__Host-csrf=test-token",
      } : {},
    } as any,
    res: {} as any,
  };
}

describe("CSRF Protection", () => {
  it("public mutation (logout) should fail without CSRF token", async () => {
    const ctx = createAuthContext(false);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.auth.logout()).rejects.toThrow("CSRF token mismatch or missing");
  });

  it("protected mutation (social.disconnectAccount) should fail without CSRF token", async () => {
    const ctx = createAuthContext(false);
    const caller = appRouter.createCaller(ctx);

    // This is EXPECTED TO FAIL (the test should fail) if the vulnerability exists
    // Because it will NOT throw the CSRF error
    await expect(caller.social.disconnectAccount({ platform: "facebook" })).rejects.toThrow("CSRF token mismatch or missing");
  });

  it("protected mutation should pass WITH CSRF token", async () => {
      const ctx = createAuthContext(true);
      const caller = appRouter.createCaller(ctx);

      // We expect this to pass (or fail with a different error like DB not connected, but not CSRF error)
      try {
          await caller.social.disconnectAccount({ platform: "facebook" });
      } catch (error: any) {
          expect(error.message).not.toBe("CSRF token mismatch or missing");
      }
  });
});
