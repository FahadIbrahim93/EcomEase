import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
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

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {
        "x-csrf-token": "test-token",
        "cookie": "__Host-csrf=test-token",
      },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("products.generateDescription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate a product description using LLM", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Mock the LLM response
    const mockDescription =
      "Premium gold necklace with elegant design. Perfect for special occasions and everyday wear. High-quality craftsmanship.";

    (invokeLLM as any).mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: mockDescription,
          },
        },
      ],
    });

    const result = await caller.products.generateDescription({
      name: "Gold Necklace",
      category: "Jewelry",
      price: "1500",
      sku: "GN-001",
    });

    expect(result.success).toBe(true);
    expect(result.description).toBe(mockDescription);
    expect(invokeLLM).toHaveBeenCalledOnce();
  });

  it("should require product name", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.products.generateDescription({
        name: "",
        category: "Jewelry",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Too small");
    }
  });

  it("should handle LLM errors gracefully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Mock the LLM to throw an error
    (invokeLLM as any).mockRejectedValueOnce(
      new Error("LLM service unavailable")
    );

    try {
      await caller.products.generateDescription({
        name: "Gold Necklace",
        category: "Jewelry",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Failed to generate description");
    }
  });

  it("should include optional product details in prompt", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const mockDescription = "A beautiful product";

    (invokeLLM as any).mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: mockDescription,
          },
        },
      ],
    });

    await caller.products.generateDescription({
      name: "Premium Watch",
      category: "Accessories",
      price: "5000",
      sku: "PW-001",
      existingDescription: "Luxury watch",
    });

    // Verify that invokeLLM was called with the product details
    expect(invokeLLM).toHaveBeenCalledOnce();
    const callArgs = (invokeLLM as any).mock.calls[0][0];
    expect(callArgs.messages).toBeDefined();
    expect(callArgs.messages[1].content).toContain("Premium Watch");
  });

  it("should return description as string even if LLM returns object", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Mock LLM returning an object instead of string
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: { text: "Product description" },
          },
        },
      ],
    });

    const result = await caller.products.generateDescription({
      name: "Test Product",
    });

    expect(result.success).toBe(true);
    expect(typeof result.description).toBe("string");
  });
});
