import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getAnalytics, getPlatformStats } from "../db";

export const analyticsRouter = router({
  getSalesData: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).default(30) }))
    .query(async ({ ctx, input }) => {
      return getAnalytics(ctx.user.id, input.days);
    }),

  getPlatformStats: protectedProcedure.query(async ({ ctx }) => {
    return getPlatformStats(ctx.user.id);
  }),
});
