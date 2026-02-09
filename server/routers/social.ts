import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { ensureDb, getSocialConnections, getSocialConnection } from "../db";
import { socialConnections } from "../../drizzle/schema";

export const socialRouter = router({
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    return getSocialConnections(ctx.user.id);
  }),

  getConnection: protectedProcedure
    .input(z.object({ platform: z.enum(["facebook", "instagram", "tiktok"]) }))
    .query(async ({ ctx, input }) => {
      return getSocialConnection(ctx.user.id, input.platform);
    }),

  connectAccount: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["facebook", "instagram", "tiktok"]),
        accountId: z.string(),
        accountName: z.string(),
        accessToken: z.string(),
        refreshToken: z.string().optional(),
        tokenExpiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();

      await db
        .insert(socialConnections)
        .values({
          userId: ctx.user.id,
          platform: input.platform,
          accountId: input.accountId,
          accountName: input.accountName,
          accessToken: input.accessToken,
          refreshToken: input.refreshToken,
          tokenExpiresAt: input.tokenExpiresAt,
          isConnected: true,
        })
        .onDuplicateKeyUpdate({
          set: {
            accessToken: input.accessToken,
            refreshToken: input.refreshToken,
            tokenExpiresAt: input.tokenExpiresAt,
            isConnected: true,
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }),

  disconnectAccount: protectedProcedure
    .input(z.object({ platform: z.enum(["facebook", "instagram", "tiktok"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();

      await db
        .update(socialConnections)
        .set({ isConnected: false, updatedAt: new Date() })
        .where(
          and(
            eq(socialConnections.userId, ctx.user.id),
            eq(socialConnections.platform, input.platform)
          )
        );

      return { success: true };
    }),
});
