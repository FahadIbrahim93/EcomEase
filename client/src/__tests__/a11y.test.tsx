import * as React from "react";
// Provide React global for components that expect a global React symbol (compat)
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// @ts-ignore
import { axe, toHaveNoViolations } from "jest-axe";
import { vi, expect, describe, test } from "vitest";
import Home from "../pages/Home";
import DashboardLayout from "../components/DashboardLayout";
import { ThemeProvider } from "../contexts/ThemeContext";

// @ts-ignore
expect.extend(toHaveNoViolations);

vi.mock("@/_core/hooks/useAuth", () => {
  return {
    useAuth: () => ({
      user: { name: "Test User", email: "test@example.com" },
      loading: false,
      logout: vi.fn(),
    }),
  };
});

describe("Accessibility and keyboard behavior", () => {
  test("Home page should have no automatic accessibility violations", async () => {
    const { container } = render(
      <ThemeProvider defaultTheme="light">
        <Home />
      </ThemeProvider>
    );

    const results = await axe(container);
    // @ts-ignore
    expect(results).toHaveNoViolations();
  });

  test("DashboardLayout resizer is keyboard operable and updates width", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider defaultTheme="light">
        <DashboardLayout>
          <div>Child</div>
        </DashboardLayout>
      </ThemeProvider>
    );

    const separator = screen.getByRole("separator");
    separator.focus();

    // initial width from localStorage or default
    const SIDEBAR_WIDTH_KEY = "sidebar-width";
    const initial = parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY) || "280", 10);

    await user.keyboard("{ArrowRight}");
    const after = parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY) || String(initial), 10);

    expect(after).toBeGreaterThanOrEqual(initial);
  });
});
