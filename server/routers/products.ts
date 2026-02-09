import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { ensureDb, getProduct, getProducts } from "../db";
import { products } from "../../drizzle/schema";

export const productsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return getProducts(ctx.user.id, input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const product = await getProduct(ctx.user.id, input.id);
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }
      return product;
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
      const db = await ensureDb();
      const images = input.images ? JSON.stringify(input.images) : null;

      const result = await db.insert(products).values({
        ...input,
        userId: ctx.user.id,
        images,
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
      const db = await ensureDb();

      const product = await getProduct(ctx.user.id, input.id);
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      const { id, images, ...rest } = input;
      const updateData = {
        ...rest,
        ...(images !== undefined ? { images: JSON.stringify(images) } : {}),
        updatedAt: new Date(),
      };

      await db.update(products).set(updateData).where(eq(products.id, id));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();

      const product = await getProduct(ctx.user.id, input.id);
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      await db.delete(products).where(eq(products.id, input.id));

      return { success: true };
    }),

  adjustStock: protectedProcedure
    .input(z.object({ id: z.number(), adjustment: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();

      const product = await getProduct(ctx.user.id, input.id);
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      const newQuantity = Math.max(0, product.stockQuantity + input.adjustment);
      await db
        .update(products)
        .set({ stockQuantity: newQuantity, updatedAt: new Date() })
        .where(eq(products.id, input.id));

      return { success: true, newQuantity };
    }),
});
