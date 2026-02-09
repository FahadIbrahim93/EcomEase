import { eq, and, desc, gte, sql, count, sum } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { drizzle } from "drizzle-orm/mysql2";
import { logger } from "./_core/logger";
import {
  InsertUser,
  users,
  socialConnections,
  products,
  posts,
  orders,
  invoices,
  activityLog,
  analytics,
  orderItems
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      logger.error("[Database] Failed to connect", { error });
      _db = null;
    }
  }
  return _db;
}

export async function ensureDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });
  }
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");

  const db = await ensureDb();

  try {
    const { openId, ...rest } = user;
    const role = user.role ?? (openId === ENV.ownerOpenId ? "admin" : "user");
    const lastSignedIn = user.lastSignedIn ?? new Date();

    const values = {
      openId,
      ...rest,
      role,
      lastSignedIn,
    };

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: {
        name: rest.name ?? null,
        email: rest.email ?? null,
        loginMethod: rest.loginMethod ?? null,
        role,
        lastSignedIn
      },
    });
  } catch (error) {
    logger.error("[Database] Upsert user failed", { openId: user.openId, error });
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await ensureDb();
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(userId: number) {
  const db = await ensureDb();
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function getSocialConnections(userId: number) {
  const db = await ensureDb();
  return db.select().from(socialConnections).where(eq(socialConnections.userId, userId));
}

export async function getSocialConnection(userId: number, platform: "facebook" | "instagram" | "tiktok") {
  const db = await ensureDb();
  const result = await db
    .select()
    .from(socialConnections)
    .where(
      and(
        eq(socialConnections.userId, userId),
        eq(socialConnections.platform, platform)
      )
    )
    .limit(1);
  return result[0];
}

export async function getProducts(userId: number, options?: { limit?: number; offset?: number }) {
  const db = await ensureDb();
  let query = db.select().from(products).where(eq(products.userId, userId)).$dynamic();
  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset) query = query.offset(options.offset);
  return query;
}

export async function getProduct(userId: number, productId: number) {
  const db = await ensureDb();
  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.userId, userId), eq(products.id, productId)))
    .limit(1);
  return result[0];
}

export async function getPosts(userId: number, options?: { limit?: number; offset?: number }) {
  const db = await ensureDb();
  let query = db.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.createdAt)).$dynamic();
  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset) query = query.offset(options.offset);
  return query;
}

export async function getPost(userId: number, postId: number) {
  const db = await ensureDb();
  const result = await db
    .select()
    .from(posts)
    .where(and(eq(posts.userId, userId), eq(posts.id, postId)))
    .limit(1);
  return result[0];
}

export async function getOrders(userId: number, options?: { limit?: number; offset?: number; status?: string }) {
  const db = await ensureDb();
  const conditions = [eq(orders.userId, userId)];
  if (options?.status) {
    // Correct way to cast enum string for Drizzle
    conditions.push(eq(orders.status, options.status as any));
  }

  let query = db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.createdAt)).$dynamic();
  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset) query = query.offset(options.offset);
  return query;
}

export async function getOrder(userId: number, orderId: number) {
  const db = await ensureDb();
  const result = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.id, orderId)))
    .limit(1);

  if (result.length === 0) return undefined;
  const order = result[0];
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return { ...order, items };
}

export async function getInvoices(userId: number, options?: { limit?: number; offset?: number }) {
  const db = await ensureDb();
  let query = db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt)).$dynamic();
  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset) query = query.offset(options.offset);
  return query;
}

export async function getInvoice(userId: number, invoiceId: number) {
  const db = await ensureDb();
  const result = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.userId, userId), eq(invoices.id, invoiceId)))
    .limit(1);
  return result[0];
}

export async function getActivityLog(userId: number, limit = 50) {
  const db = await ensureDb();
  return db
    .select()
    .from(activityLog)
    .where(eq(activityLog.userId, userId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}

export async function getAnalytics(userId: number, days = 30) {
  const db = await ensureDb();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return db
    .select()
    .from(analytics)
    .where(and(eq(analytics.userId, userId), gte(analytics.date, startDate)))
    .orderBy(analytics.date);
}

export async function getPlatformStats(userId: number) {
  const db = await ensureDb();
  const result = await db
    .select({
      platform: orders.platform,
      orderCount: count(orders.id),
      totalRevenue: sum(orders.totalAmount),
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .groupBy(orders.platform);

  const stats: Record<string, { orders: number; revenue: number }> = {
    facebook: { orders: 0, revenue: 0 },
    instagram: { orders: 0, revenue: 0 },
    tiktok: { orders: 0, revenue: 0 },
  };

  result.forEach((row) => {
    if (row.platform && stats[row.platform]) {
      stats[row.platform].orders = row.orderCount;
      stats[row.platform].revenue = row.totalRevenue ? parseFloat(row.totalRevenue.toString()) : 0;
    }
  });

  return stats;
}

export async function getDashboardStats(userId: number) {
  const db = await ensureDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [productStats, orderStats] = await Promise.all([
    db.select({
      totalProducts: count(products.id),
      lowStockCount: count(sql`CASE WHEN ${products.stockQuantity} <= ${products.lowStockThreshold} THEN 1 END`),
    }).from(products).where(eq(products.userId, userId)),
    db.select({
      todayOrdersCount: count(orders.id),
      todayRevenue: sum(orders.totalAmount),
    }).from(orders).where(and(eq(orders.userId, userId), gte(orders.createdAt, today)))
  ]);

  const p = productStats[0] || { totalProducts: 0, lowStockCount: 0 };
  const o = orderStats[0] || { todayOrdersCount: 0, todayRevenue: null };

  return {
    totalProducts: p.totalProducts,
    lowStockCount: p.lowStockCount,
    todayOrders: o.todayOrdersCount,
    todayRevenue: o.todayRevenue ? parseFloat(o.todayRevenue.toString()) : 0,
  };
}
