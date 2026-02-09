import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { ensureDb, getSocialConnections, getSocialConnection } from "../db";
import { socialConnections } from "../../drizzle/schema";

const platformEnum = z.enum(["facebook", "instagram", "tiktok"]);

export const socialRouter = router({
  getConnections: protectedProcedure.query(({ ctx }) => getSocialConnections(ctx.user.id)),

  getConnection: protectedProcedure
    .input(z.object({ platform: platformEnum }))
    .query(({ ctx, input }) => getSocialConnection(ctx.user.id, input.platform)),

  connectAccount: protectedProcedure
    .input(z.object({
      platform: platformEnum,
      accountId: z.string(),
      accountName: z.string(),
      accessToken: z.string(),
      refreshToken: z.string().optional(),
      tokenExpiresAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      await db.insert(socialConnections).values({
        ...input,
        userId: ctx.user.id,
        isConnected: true,
      }).onDuplicateKeyUpdate({
        set: { ...input, isConnected: true, updatedAt: new Date() },
      });
      return { success: true };
    }),

  disconnectAccount: protectedProcedure
    .input(z.object({ platform: platformEnum }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      await db.update(socialConnections).set({ isConnected: false, updatedAt: new Date() })
        .where(and(eq(socialConnections.userId, ctx.user.id), eq(socialConnections.platform, input.platform)));
      return { success: true };
    }),
});
