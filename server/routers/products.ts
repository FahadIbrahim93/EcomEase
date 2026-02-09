import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { ensureDb, getProduct, getProducts } from "../db";
import { products } from "../../drizzle/schema";

const productInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.string().min(1),
  costPrice: z.string().optional(),
  stockQuantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  sku: z.string().optional(),
  category: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export const productsRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => getProducts(ctx.user.id, input)),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const product = await getProduct(ctx.user.id, input.id);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      return product;
    }),

  create: protectedProcedure
    .input(productInput)
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      const [result] = await db.insert(products).values({
        ...input,
        userId: ctx.user.id,
        images: input.images ? JSON.stringify(input.images) : null,
      });
      return { success: true, id: result.insertId };
    }),

  update: protectedProcedure
    .input(productInput.partial().extend({ id: z.number(), isActive: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      const product = await getProduct(ctx.user.id, input.id);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });

      const { id, images, ...rest } = input;
      await db.update(products).set({
        ...rest,
        ...(images !== undefined ? { images: JSON.stringify(images) } : {}),
        updatedAt: new Date(),
      }).where(eq(products.id, id));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      const product = await getProduct(ctx.user.id, input.id);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });

      await db.delete(products).where(eq(products.id, input.id));
      return { success: true };
    }),

  adjustStock: protectedProcedure
    .input(z.object({ id: z.number(), adjustment: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ensureDb();
      const product = await getProduct(ctx.user.id, input.id);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });

      const stockQuantity = Math.max(0, product.stockQuantity + input.adjustment);
      await db.update(products).set({ stockQuantity, updatedAt: new Date() }).where(eq(products.id, input.id));
      return { success: true, newQuantity: stockQuantity };
    }),
});
