import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getSocialConnections,
  getSocialConnection,
  getProducts,
  getProduct,
  getPosts,
  getPost,
  getOrders,
  getOrder,
  getInvoices,
  getInvoice,
  getActivityLog,
  getAnalytics,
  getDashboardStats,
  getDb,
} from "./db";
import {
  socialConnections,
  products,
  posts,
  orders,
  invoices,
  activityLog,
  analytics,
  InsertProduct,
  InsertPost,
  InsertOrder,
  InsertInvoice,
  InsertActivityLog,
} from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Dashboard
  dashboard: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return getDashboardStats(ctx.user.id);
    }),

    getActivityFeed: protectedProcedure.query(async ({ ctx }) => {
      return getActivityLog(ctx.user.id, 20);
    }),
  }),

  // Social Connections
  social: router({
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
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db
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
        const db = await getDb();
        if (!db) throw new Error("Database not available");

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
  }),

  // Products
  products: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getProducts(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getProduct(ctx.user.id, input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          price: z.string().min(1),
          costPrice: z.string().optional(),
          stockQuantity: z.number().int().min(0),
          lowStockThreshold: z.number().int().min(0).default(5),
          sku: z.string().optional(),
          category: z.string().optional(),
          images: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(products).values({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          price: input.price,
          costPrice: input.costPrice,
          stockQuantity: input.stockQuantity,
          lowStockThreshold: input.lowStockThreshold,
          sku: input.sku,
          category: input.category,
          images: input.images ? JSON.stringify(input.images) : null,
        });

        return { success: true, id: result[0].insertId };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          price: z.string().optional(),
          costPrice: z.string().optional(),
          stockQuantity: z.number().int().optional(),
          lowStockThreshold: z.number().int().optional(),
          sku: z.string().optional(),
          category: z.string().optional(),
          images: z.array(z.string()).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const product = await getProduct(ctx.user.id, input.id);
        if (!product) throw new Error("Product not found");

        const updateData: any = { updatedAt: new Date() };
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.price !== undefined) updateData.price = input.price;
        if (input.costPrice !== undefined) updateData.costPrice = input.costPrice;
        if (input.stockQuantity !== undefined) updateData.stockQuantity = input.stockQuantity;
        if (input.lowStockThreshold !== undefined) updateData.lowStockThreshold = input.lowStockThreshold;
        if (input.sku !== undefined) updateData.sku = input.sku;
        if (input.category !== undefined) updateData.category = input.category;
        if (input.images !== undefined) updateData.images = JSON.stringify(input.images);
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        await db.update(products).set(updateData).where(eq(products.id, input.id));

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const product = await getProduct(ctx.user.id, input.id);
        if (!product) throw new Error("Product not found");

        await db.delete(products).where(eq(products.id, input.id));

        return { success: true };
      }),

    adjustStock: protectedProcedure
      .input(z.object({ id: z.number(), adjustment: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const product = await getProduct(ctx.user.id, input.id);
        if (!product) throw new Error("Product not found");

        const newQuantity = Math.max(0, product.stockQuantity + input.adjustment);
        await db
          .update(products)
          .set({ stockQuantity: newQuantity, updatedAt: new Date() })
          .where(eq(products.id, input.id));

        return { success: true, newQuantity };
      }),
  }),

  // Posts
  posts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getPosts(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getPost(ctx.user.id, input.id);
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
        const db = await getDb();
        if (!db) throw new Error("Database not available");

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
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const post = await getPost(ctx.user.id, input.id);
        if (!post) throw new Error("Post not found");

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
          description: `Published post to ${post.platforms}`,
        });

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const post = await getPost(ctx.user.id, input.id);
        if (!post) throw new Error("Post not found");

        await db.delete(posts).where(eq(posts.id, input.id));

        return { success: true };
      }),
  }),

  // Orders
  orders: router({
    list: protectedProcedure
      .input(
        z.object({
          status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled"]).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const allOrders = await getOrders(ctx.user.id);
        if (input.status) {
          return allOrders.filter((o) => o.status === input.status);
        }
        return allOrders;
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getOrder(ctx.user.id, input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          orderNumber: z.string(),
          platform: z.enum(["facebook", "instagram", "tiktok"]),
          platformOrderId: z.string().optional(),
          customerName: z.string(),
          customerPhone: z.string().optional(),
          customerEmail: z.string().optional(),
          shippingAddress: z.string().optional(),
          items: z.array(
            z.object({
              productId: z.number(),
              quantity: z.number().int().min(1),
              price: z.string(),
            })
          ),
          totalAmount: z.string(),
          paymentMethod: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(orders).values({
          userId: ctx.user.id,
          orderNumber: input.orderNumber,
          platform: input.platform,
          platformOrderId: input.platformOrderId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail,
          shippingAddress: input.shippingAddress,
          items: JSON.stringify(input.items),
          totalAmount: input.totalAmount,
          paymentMethod: input.paymentMethod,
          notes: input.notes,
          status: "pending",
        });

        await db.insert(activityLog).values({
          userId: ctx.user.id,
          action: "order_received",
          entityType: "order",
          entityId: result[0].insertId,
          description: `New order from ${input.customerName}`,
        });

        return { success: true, id: result[0].insertId };
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const order = await getOrder(ctx.user.id, input.id);
        if (!order) throw new Error("Order not found");

        await db
          .update(orders)
          .set({ status: input.status, updatedAt: new Date() })
          .where(eq(orders.id, input.id));

        await db.insert(activityLog).values({
          userId: ctx.user.id,
          action: "order_status_updated",
          entityType: "order",
          entityId: input.id,
          description: `Order status changed to ${input.status}`,
        });

        return { success: true };
      }),
  }),

  // Invoices
  invoices: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getInvoices(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getInvoice(ctx.user.id, input.id);
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
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const order = await getOrder(ctx.user.id, input.orderId);
        if (!order) throw new Error("Order not found");

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
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const invoice = await getInvoice(ctx.user.id, input.id);
        if (!invoice) throw new Error("Invoice not found");

        await db
          .update(invoices)
          .set({ status: input.status, updatedAt: new Date() })
          .where(eq(invoices.id, input.id));

        return { success: true };
      }),
  }),

  // Analytics
  analytics: router({
    getSalesData: protectedProcedure
      .input(z.object({ days: z.number().int().min(1).default(30) }))
      .query(async ({ ctx, input }) => {
        return getAnalytics(ctx.user.id, input.days);
      }),

    getPlatformStats: protectedProcedure.query(async ({ ctx }) => {
      const userOrders = await getOrders(ctx.user.id);
      const platformStats: Record<string, { orders: number; revenue: number }> = {
        facebook: { orders: 0, revenue: 0 },
        instagram: { orders: 0, revenue: 0 },
        tiktok: { orders: 0, revenue: 0 },
      };

      userOrders.forEach((order) => {
        if (platformStats[order.platform]) {
          platformStats[order.platform].orders += 1;
          platformStats[order.platform].revenue += parseFloat(order.totalAmount.toString());
        }
      });

      return platformStats;
    }),
  }),
});

export type AppRouter = typeof appRouter;

// Helper imports
import { eq } from "drizzle-orm";
import { and } from "drizzle-orm";
