import { describe, expect, it, vi } from "vitest";
import { appRouter } from "../routers";
import { COOKIE_NAME } from "../../shared/const";
import type { TrpcContext } from "../_core/context";

// Mock the entire db module
vi.mock("../db", () => ({
  getDashboardStats: vi.fn(),
  getActivityLog: vi.fn(),
  getProducts: vi.fn(),
  getProduct: vi.fn(),
  getOrders: vi.fn(),
  getOrder: vi.fn(),
  getInvoices: vi.fn(),
  getInvoice: vi.fn(),
  ensureDb: vi.fn(),
}));

import * as db from "../db";

function createAuthContext(user: any = null): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {
        "x-csrf-token": "test-token",
        "cookie": "csrf_token=test-token",
      },
    } as any,
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

describe("Auth Router", () => {
  it("me: returns current user when authenticated", async () => {
    const user = { id: 1, name: "Test User" };
    const ctx = createAuthContext(user);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toEqual(user);
  });

  it("me: returns null when unauthenticated", async () => {
    const ctx = createAuthContext(null);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("logout: clears cookie and returns success", async () => {
    const ctx = createAuthContext({ id: 1 });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(ctx.res.clearCookie).toHaveBeenCalledWith(COOKIE_NAME, expect.any(Object));
  });
});
