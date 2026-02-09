import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { ensureDb, getInvoice, getInvoices, getOrder } from "../db";
import { invoices } from "../../drizzle/schema";

export const invoicesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return getInvoices(ctx.user.id, input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const invoice = await getInvoice(ctx.user.id, input.id);
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
      return invoice;
    }),

  create: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        invoiceNumber: z.string(),
        subtotal: z.string(),
        tax: z.string().optional(),
        discount: z.string().optional(),
        total: z.string(),
        notes: z.string().optional(),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();

      const order = await getOrder(ctx.user.id, input.orderId);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });

      const result = await db.insert(invoices).values({
        userId: ctx.user.id,
        orderId: input.orderId,
        invoiceNumber: input.invoiceNumber,
        subtotal: input.subtotal,
        tax: input.tax || "0",
        discount: input.discount || "0",
        total: input.total,
        notes: input.notes,
        dueDate: input.dueDate,
        status: "draft",
      });

      return { success: true, id: result[0].insertId };
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["draft", "sent", "viewed", "paid", "overdue"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();

      const invoice = await getInvoice(ctx.user.id, input.id);
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });

      await db
        .update(invoices)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(invoices.id, input.id));

      return { success: true };
    }),
});
