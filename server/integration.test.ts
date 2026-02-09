import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Realistic in-memory DB state
const mockDbState = {
  users: [] as any[],
  products: [] as any[],
  orders: [] as any[],
  orderItems: [] as any[],
  activityLog: [] as any[],
};

vi.mock("./db", () => ({
  ensureDb: vi.fn().mockImplementation(async () => ({
    insert: (table: any) => ({
      values: (values: any) => {
        const id = Math.floor(Math.random() * 10000);
        const entry = { id, ...values };
        // Heuristic-based table detection for mock
        if (values.sku || values.price !== undefined && !values.orderId) mockDbState.products.push(entry);
        else if (values.orderNumber) mockDbState.orders.push(entry);
        else if (values.orderId && values.productId) mockDbState.orderItems.push(entry);
        else if (values.action) mockDbState.activityLog.push(entry);
        return Promise.resolve([{ insertId: id }]);
      }
    }),
    select: () => ({
      from: (table: any) => ({
        where: () => ({
          limit: () => {
             if (table._?.name === "products") return mockDbState.products;
             return [];
          },
          orderBy: () => mockDbState.products
        })
      })
    }),
    transaction: (cb: any) => cb({
       insert: (table: any) => ({
         values: (values: any) => {
           const id = Math.floor(Math.random() * 10000);
           const entry = { id, ...values };
           if (values.sku || values.price !== undefined && !values.orderId) mockDbState.products.push(entry);
           else if (values.orderNumber) mockDbState.orders.push(entry);
           else if (values.orderId && values.productId) mockDbState.orderItems.push(entry);
           else if (values.action) mockDbState.activityLog.push(entry);
           return Promise.resolve([{ insertId: id }]);
         }
       }),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve()
      })
    })
  })),
  getProducts: vi.fn().mockImplementation(async (userId) => {
    return mockDbState.products.filter(p => p.userId === userId);
  }),
  getProduct: vi.fn().mockImplementation(async (userId, id) => {
    return mockDbState.products.find(p => p.userId === userId && p.id === id);
  }),
  getOrders: vi.fn().mockImplementation(async (userId) => {
    return mockDbState.orders.filter(o => o.userId === userId);
  }),
  getOrder: vi.fn().mockImplementation(async (userId, id) => {
    const order = mockDbState.orders.find(o => o.userId === userId && o.id === id);
    if (!order) return undefined;
    const items = mockDbState.orderItems.filter(i => i.orderId === id);
    return { ...order, items };
  }),
}));

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

describe("System Integration Test", () => {
  beforeEach(() => {
    mockDbState.products = [];
    mockDbState.orders = [];
    mockDbState.orderItems = [];
    mockDbState.activityLog = [];
  });

  it("should perform a full product-to-order flow", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 1. Create a product
    const productResult = await caller.products.create({
      name: "Sourdough Starter",
      price: "15.00",
      stockQuantity: 100,
      sku: "SOUR-001"
    });
    expect(productResult.success).toBe(true);
    const productId = productResult.id;

    // 2. Verify product exists
    const product = await caller.products.get({ id: productId });
    expect(product.name).toBe("Sourdough Starter");

    // 3. Create an order for this product
    const orderResult = await caller.orders.create({
      orderNumber: "ORD-2026-001",
      platform: "facebook",
      customerName: "Jane Doe",
      items: [
        { productId, quantity: 2, price: "15.00" }
      ],
      totalAmount: "30.00"
    });
    expect(orderResult.success).toBe(true);
    const orderId = orderResult.id;

    // 4. Verify order and items
    const order = await caller.orders.get({ id: orderId });
    expect(order.orderNumber).toBe("ORD-2026-001");
    expect(order.items).toHaveLength(1);
    expect(order.items[0].productId).toBe(productId);

    // 5. Check activity log
    expect(mockDbState.activityLog.some(l => l.action === "order_received")).toBe(true);
  });

  it("should enforce authentication", async () => {
    const ctx = createAuthContext(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.products.list()).rejects.toThrow(/Please login/);
  });

  it("should enforce CSRF protection on mutations", async () => {
    const ctx = createAuthContext();
    ctx.req.headers["x-csrf-token"] = "wrong-token";
    const caller = appRouter.createCaller(ctx);
    await expect(caller.products.create({
      name: "Fail",
      price: "10.00",
      stockQuantity: 1
    })).rejects.toThrow(/CSRF token mismatch/);
  });

  it("should enforce rate limits", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Call system.health many times
    for (let i = 0; i < 100; i++) {
      await caller.system.health({});
    }

    await expect(caller.system.health({})).rejects.toThrow(/Too many requests/);
  });

  it("should validate inputs via Zod", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Invalid price
    await expect(caller.products.create({
      name: "Bad Price",
      price: "", // Empty string not allowed by min(1)
      stockQuantity: 1
    } as any)).rejects.toThrow();
  });

  it("should handle database errors gracefully", async () => {
    const db = await import("./db");
    vi.mocked(db.ensureDb).mockRejectedValueOnce(new Error("DB Down"));

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Use a mutation that calls ensureDb
    await expect(caller.products.create({
      name: "Fail",
      price: "10.00",
      stockQuantity: 1
    })).rejects.toThrow(/DB Down/);
  });

  it("should support pagination on products", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Add 5 products
    for (let i = 1; i <= 5; i++) {
      await caller.products.create({
        name: `Product ${i}`,
        price: `${i}.00`,
        stockQuantity: 10,
        sku: `SKU-${i}`
      });
    }

    // Test pagination (assuming our mock getProducts handles it)
    const db = await import("./db");
    vi.mocked(db.getProducts).mockImplementationOnce(async (userId, options) => {
       let p = mockDbState.products.filter(item => item.userId === userId);
       if (options?.offset) p = p.slice(options.offset);
       if (options?.limit) p = p.slice(0, options.limit);
       return p;
    });

    const page1 = await caller.products.list({ limit: 2, offset: 0 });
    expect(page1).toHaveLength(2);
    expect(page1[0].name).toBe("Product 1");

    vi.mocked(db.getProducts).mockImplementationOnce(async (userId, options) => {
       let p = mockDbState.products.filter(item => item.userId === userId);
       if (options?.offset) p = p.slice(options.offset);
       if (options?.limit) p = p.slice(0, options.limit);
       return p;
    });

    const page2 = await caller.products.list({ limit: 2, offset: 2 });
    expect(page2).toHaveLength(2);
    expect(page2[0].name).toBe("Product 3");
  });
});
