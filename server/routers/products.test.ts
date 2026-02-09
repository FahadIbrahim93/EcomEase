import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import { TRPCError } from "@trpc/server";

// Mock the entire db module
vi.mock("../db", () => ({
  getProducts: vi.fn(),
  getProduct: vi.fn(),
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

describe("Products Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list: returns products for user", async () => {
    const mockProducts = [{ id: 1, name: "Product 1" }];
    vi.mocked(db.getProducts).mockResolvedValue(mockProducts as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.products.list();

    expect(result).toEqual(mockProducts);
    expect(db.getProducts).toHaveBeenCalledWith(1, undefined);
  });

  it("get: returns product by id", async () => {
    const mockProduct = { id: 1, name: "Product 1" };
    vi.mocked(db.getProduct).mockResolvedValue(mockProduct as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.products.get({ id: 1 });

    expect(result).toEqual(mockProduct);
    expect(db.getProduct).toHaveBeenCalledWith(1, 1);
  });

  it("get: throws NOT_FOUND if product missing", async () => {
    vi.mocked(db.getProduct).mockResolvedValue(undefined);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.products.get({ id: 1 })).rejects.toThrow(/Product not found/);
  });

  it("create: inserts new product", async () => {
    const mockDb = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue([{ insertId: 100 }]),
      }),
    };
    vi.mocked(db.ensureDb).mockResolvedValue(mockDb as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.products.create({
      name: "New Product",
      price: "50.00",
      stockQuantity: 10,
    });

    expect(result).toEqual({ success: true, id: 100 });
    expect(mockDb.insert).toHaveBeenCalled();
  });
});
