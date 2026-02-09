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
  analytics
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // In production, drizzle(connectionString) with mysql2 uses a connection pool by default.
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      logger.warn("[Database] Failed to connect", { error });
      _db = null;
    }
  }
  return _db;
}

export async function ensureDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  }
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    logger.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const { openId, ...rest } = user;
    const role = user.role ?? (openId === ENV.ownerOpenId ? "admin" : undefined);
    const lastSignedIn = user.lastSignedIn ?? new Date();

    const values = {
      openId,
      ...rest,
      role,
      lastSignedIn,
    };

    const updateSet = {
      ...rest,
      role,
      lastSignedIn,
    };

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet as any,
    });
  } catch (error) {
    logger.error("[Database] Failed to upsert user", { error });
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    logger.warn("[Database] Cannot get user by openId: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) {
    logger.warn("[Database] Cannot get user by id: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Social Connections
export async function getSocialConnections(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(socialConnections).where(eq(socialConnections.userId, userId));
}

export async function getSocialConnection(userId: number, platform: "facebook" | "instagram" | "tiktok") {
  const db = await getDb();
  if (!db) return undefined;
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

// Products
export async function getProducts(userId: number, options?: { limit?: number; offset?: number }) {
  const db = await ensureDb();

  let query = db.select().from(products).where(eq(products.userId, userId));

  if (options?.limit !== undefined) {
    query = query.limit(options.limit) as any;
  }
  if (options?.offset !== undefined) {
    query = query.offset(options.offset) as any;
  }

  return query;
}

export async function getProduct(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.userId, userId), eq(products.id, productId)))
    .limit(1);
  return result[0];
}

// Posts
export async function getPosts(userId: number, options?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.createdAt));

  if (options?.limit !== undefined) {
    query = query.limit(options.limit) as any;
  }
  if (options?.offset !== undefined) {
    query = query.offset(options.offset) as any;
  }

  return query;
}

export async function getPost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(posts)
    .where(and(eq(posts.userId, userId), eq(posts.id, postId)))
    .limit(1);
  return result[0];
}

// Orders
export async function getOrders(userId: number, options?: { limit?: number; offset?: number; status?: string }) {
  const db = await ensureDb();

  const conditions = [eq(orders.userId, userId)];
  if (options?.status) {
    conditions.push(eq(orders.status, options.status as any));
  }

  let query = db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.createdAt));

  if (options?.limit !== undefined) {
    query = query.limit(options.limit) as any;
  }
  if (options?.offset !== undefined) {
    query = query.offset(options.offset) as any;
  }

  return query;
}

export async function getOrder(userId: number, orderId: number) {
  const db = await getDb();
  if (!db) return undefined;

  // Use query API for cleaner relation fetching if needed,
  // but sticking to select() for consistency with the rest of the file
  const result = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.id, orderId)))
    .limit(1);

  if (result.length === 0) return undefined;
  const order = result[0];

  // Fetch items for this order
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return { ...order, items };
}

// Invoices
export async function getInvoices(userId: number, options?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));

  if (options?.limit !== undefined) {
    query = query.limit(options.limit) as any;
  }
  if (options?.offset !== undefined) {
    query = query.offset(options.offset) as any;
  }

  return query;
}

export async function getInvoice(userId: number, invoiceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.userId, userId), eq(invoices.id, invoiceId)))
    .limit(1);
  return result[0];
}

// Activity Log
export async function getActivityLog(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(activityLog)
    .where(eq(activityLog.userId, userId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}

// Analytics
export async function getAnalytics(userId: number, days = 30) {
  const db = await getDb();
  if (!db) return [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return db
    .select()
    .from(analytics)
    .where(and(eq(analytics.userId, userId), gte(analytics.date, startDate)))
    .orderBy(analytics.date);
}

// Platform Stats
export async function getPlatformStats(userId: number) {
  const db = await getDb();
  if (!db) return { facebook: { orders: 0, revenue: 0 }, instagram: { orders: 0, revenue: 0 }, tiktok: { orders: 0, revenue: 0 } };

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

// Dashboard Stats
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const statsResult = await db
    .select({
      totalProducts: count(products.id),
      lowStockCount: count(sql`CASE WHEN ${products.stockQuantity} <= ${products.lowStockThreshold} THEN 1 END`),
    })
    .from(products)
    .where(eq(products.userId, userId));

  const ordersStatsResult = await db
    .select({
      todayOrdersCount: count(orders.id),
      todayRevenue: sum(orders.totalAmount),
    })
    .from(orders)
    .where(and(eq(orders.userId, userId), gte(orders.createdAt, today)));

  const productStats = statsResult[0] || { totalProducts: 0, lowStockCount: 0 };
  const orderStats = ordersStatsResult[0] || { todayOrdersCount: 0, todayRevenue: null };

  return {
    totalProducts: productStats.totalProducts,
    lowStockCount: productStats.lowStockCount,
    todayOrders: orderStats.todayOrdersCount,
    todayRevenue: orderStats.todayRevenue ? parseFloat(orderStats.todayRevenue.toString()) : 0,
  };
}
