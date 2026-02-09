import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { ensureDb, getPosts, getPost } from "../db";
import { posts, activityLog } from "../../drizzle/schema";

export const postsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return getPosts(ctx.user.id, input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const post = await getPost(ctx.user.id, input.id);
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      return post;
    }),

  create: protectedProcedure
    .input(
      z.object({
        caption: z.string().optional(),
        hashtags: z.string().optional(),
        mediaUrls: z.array(z.string()),
        mediaType: z.enum(["image", "video", "carousel"]),
        platforms: z.array(z.enum(["facebook", "instagram", "tiktok"])),
        scheduledAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      const status = input.scheduledAt ? "scheduled" : "draft";

      const result = await db.insert(posts).values({
        userId: ctx.user.id,
        caption: input.caption,
        hashtags: input.hashtags,
        mediaUrls: JSON.stringify(input.mediaUrls),
        mediaType: input.mediaType,
        platforms: JSON.stringify(input.platforms),
        status: status,
        scheduledAt: input.scheduledAt,
      });

      await db.insert(activityLog).values({
        userId: ctx.user.id,
        action: "post_created",
        entityType: "post",
        entityId: result[0].insertId,
        description: `Created ${status} post`,
      });

      return { success: true, id: result[0].insertId };
    }),

  publish: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();

      const post = await getPost(ctx.user.id, input.id);
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });

      await db
        .update(posts)
        .set({
          status: "published",
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(posts.id, input.id));

      await db.insert(activityLog).values({
        userId: ctx.user.id,
        action: "post_published",
        entityType: "post",
        entityId: input.id,
        description: `Published post to ${JSON.stringify(post.platforms)}`,
      });

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();

      const post = await getPost(ctx.user.id, input.id);
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });

      await db.delete(posts).where(eq(posts.id, input.id));

      return { success: true };
    }),
});
