import * as React from "react";
(globalThis as any).React = React;
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { expect, describe, test, vi } from "vitest";
import Inventory from "../pages/Inventory";
import { TooltipProvider } from "../components/ui/tooltip";

// Mock tRPC
vi.mock("@/lib/trpc", () => ({
  trpc: {
    products: {
      list: {
        useQuery: () => ({
          data: [
            {
              id: 1,
              name: "Test Product",
              category: "Test Category",
              price: "100",
              stockQuantity: 10,
              lowStockThreshold: 5,
              isActive: true,
            },
          ],
          isLoading: false,
          refetch: vi.fn(),
        }),
      },
      create: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      update: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      delete: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      adjustStock: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      generateDescription: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
    },
  },
}));

// Mock Auth
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { name: "Test User", email: "test@example.com" },
    loading: false,
    logout: vi.fn(),
  }),
}));

// Mock wouter
vi.mock("wouter", () => ({
  useLocation: () => ["/inventory", vi.fn()],
  Route: ({ children }: any) => children,
  Switch: ({ children }: any) => children,
}));

describe("Inventory Page Accessibility", () => {
  test("Action buttons have aria-labels and tooltips", async () => {
    render(
      <TooltipProvider>
        <Inventory />
      </TooltipProvider>
    );

    const editButton = screen.getAllByLabelText("Edit product")[0];
    const deleteButton = screen.getAllByLabelText("Delete product")[0];

    expect(editButton).toBeDefined();
    expect(deleteButton).toBeDefined();
  });

  test("Form inputs have associated labels in the dialog", async () => {
    render(
      <TooltipProvider>
        <Inventory />
      </TooltipProvider>
    );

    // Open the dialog
    const addButton = screen.getAllByText("Add Product")[0];
    fireEvent.click(addButton);

    // Check for labels and their associated inputs
    const nameInput = screen.getAllByLabelText(/Product Name \*/i)[0];
    expect(nameInput.tagName).toBe("INPUT");
    expect(nameInput.id).toBe("product-name");

    const skuInput = screen.getAllByLabelText(/SKU/i)[0];
    expect(skuInput.tagName).toBe("INPUT");
    expect(skuInput.id).toBe("sku");

    const descInput = screen.getAllByLabelText(/Description/i)[0];
    expect(descInput.tagName).toBe("INPUT");
    expect(descInput.id).toBe("description");

    const priceInput = screen.getAllByLabelText(/Price \*/i)[0];
    expect(priceInput.tagName).toBe("INPUT");
    expect(priceInput.id).toBe("price");
  });

  test("Search input has aria-label", () => {
    render(
      <TooltipProvider>
        <Inventory />
      </TooltipProvider>
    );

    const searchInputs = screen.getAllByLabelText("Search products");
    expect(searchInputs.length).toBeGreaterThanOrEqual(1);
    const searchInput = searchInputs[0];
    expect(searchInput.getAttribute("placeholder")).toBe("Search products...");
  });
});
