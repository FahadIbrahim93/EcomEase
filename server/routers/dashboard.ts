import { router, protectedProcedure } from "../_core/trpc";
import { getDashboardStats, getActivityLog } from "../db";

export const dashboardRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    return getDashboardStats(ctx.user.id);
  }),

  getActivityFeed: protectedProcedure.query(async ({ ctx }) => {
    return getActivityLog(ctx.user.id, 20);
  }),
});
