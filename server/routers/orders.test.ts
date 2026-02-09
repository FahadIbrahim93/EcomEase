import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock the entire db module
vi.mock("../db", () => ({
  getOrders: vi.fn(),
  getOrder: vi.fn(),
  ensureDb: vi.fn(),
}));

import * as db from "../db";

function createAuthContext(user: any = { id: 1, role: 'user' }): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {
        "x-csrf-token": "test-token",
        "cookie": "csrf_token=test-token",
      },
    } as any,
    res: {} as any,
  };
}

describe("Orders Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create: inserts order and items within a transaction", async () => {
    const mockTx = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue([{ insertId: 500 }]),
      }),
    };
    const mockDb = {
      transaction: vi.fn().mockImplementation(async (callback) => {
        return callback(mockTx);
      }),
    };
    vi.mocked(db.ensureDb).mockResolvedValue(mockDb as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orders.create({
      orderNumber: "ORD-001",
      platform: "facebook",
      customerName: "John Doe",
      items: [
        { productId: 1, quantity: 2, price: "20.00" },
      ],
      totalAmount: "40.00",
    });

    expect(result).toEqual({ success: true, id: 500 });
    expect(mockDb.transaction).toHaveBeenCalled();
    expect(mockTx.insert).toHaveBeenCalledTimes(3); // Order, OrderItem, ActivityLog
  });
});
