import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getDb } from "../db";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().optional(),
      })
    )
    .query(async () => {
      let dbStatus = "unknown";
      try {
        const db = await getDb();
        if (db) {
          dbStatus = "connected";
        } else {
          dbStatus = "not_configured";
        }
      } catch (err) {
        dbStatus = "error";
      }

      return {
        status: "ok",
        db: dbStatus,
        uptime: process.uptime(),
      };
    }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
