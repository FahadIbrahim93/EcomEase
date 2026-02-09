import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { ensureDb, getOrders, getOrder } from "../db";
import { orders, activityLog, orderItems } from "../../drizzle/schema";

export const ordersRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled"]).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => getOrders(ctx.user.id, input)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const order = await getOrder(ctx.user.id, input.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      return order;
    }),

  create: protectedProcedure
    .input(z.object({
      orderNumber: z.string(),
      platform: z.enum(["facebook", "instagram", "tiktok"]),
      platformOrderId: z.string().optional(),
      customerName: z.string(),
      customerPhone: z.string().optional(),
      customerEmail: z.string().optional(),
      shippingAddress: z.string().optional(),
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number().int().min(1),
        price: z.string(),
      })),
      totalAmount: z.string(),
      paymentMethod: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();

      return db.transaction(async (tx) => {
        const { items, ...orderData } = input;
        const [result] = await tx.insert(orders).values({
          ...orderData,
          userId: ctx.user.id,
          items: JSON.stringify(items),
          status: "pending",
        });

        const orderId = result.insertId;

        await Promise.all([
          ...items.map(item => tx.insert(orderItems).values({
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: item.price,
          })),
          tx.insert(activityLog).values({
            userId: ctx.user.id,
            action: "order_received",
            entityType: "order",
            entityId: orderId,
            description: `New order from ${input.customerName}`,
          })
        ]);

        return { success: true, id: orderId };
      });
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      const order = await getOrder(ctx.user.id, input.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });

      await Promise.all([
        db.update(orders).set({ status: input.status, updatedAt: new Date() }).where(eq(orders.id, input.id)),
        db.insert(activityLog).values({
          userId: ctx.user.id,
          action: "order_status_updated",
          entityType: "order",
          entityId: input.id,
          description: `Order status changed to ${input.status}`,
        })
      ]);

      return { success: true };
    }),
});
