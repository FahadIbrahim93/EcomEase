import { router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { authRouter } from "./routers/auth";
import { dashboardRouter } from "./routers/dashboard";
import { socialRouter } from "./routers/social";
import { productsRouter } from "./routers/products";
import { postsRouter } from "./routers/posts";
import { ordersRouter } from "./routers/orders";
import { invoicesRouter } from "./routers/invoices";
import { analyticsRouter } from "./routers/analytics";

/**
 * Main application router.
 * Domain logic is split into sub-routers under server/routers/
 */
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  dashboard: dashboardRouter,
  social: socialRouter,
  products: productsRouter,
  posts: postsRouter,
  orders: ordersRouter,
  invoices: invoicesRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
