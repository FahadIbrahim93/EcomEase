import { eq, and, desc, gte, sql, count, sum, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { drizzle } from "drizzle-orm/mysql2";
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
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
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
      message: "Database not available",
    });
  }
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Social Connections
export async function getSocialConnections(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(socialConnections)
    .where(eq(socialConnections.userId, userId));
}

export async function getSocialConnection(userId: number, platform: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(socialConnections)
    .where(
      and(
        eq(socialConnections.userId, userId),
        eq(socialConnections.platform, platform as any)
      )
    )
    .limit(1);
  return result[0];
}

// Products
export async function getProducts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.userId, userId));
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
export async function getPosts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt));
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
export async function getOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}

export async function getOrder(userId: number, orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.id, orderId)))
    .limit(1);
  return result[0];
}

// Invoices
export async function getInvoices(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.createdAt));
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

// Platform Stats (DB-level aggregation)
export async function getPlatformStats(userId: number) {
  const db = await getDb();
  if (!db)
    return {
      facebook: { orders: 0, revenue: 0 },
      instagram: { orders: 0, revenue: 0 },
      tiktok: { orders: 0, revenue: 0 },
    };

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

  result.forEach(row => {
    if (row.platform && stats[row.platform]) {
      stats[row.platform].orders = row.orderCount;
      stats[row.platform].revenue = row.totalRevenue
        ? parseFloat(row.totalRevenue.toString())
        : 0;
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

  // Use DB-level aggregations instead of fetching all rows
  const statsResult = await db
    .select({
      totalProducts: count(products.id),
      lowStockCount: count(
        sql`CASE WHEN ${products.stockQuantity} <= ${products.lowStockThreshold} THEN 1 END`
      ),
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
  const orderStats = ordersStatsResult[0] || {
    todayOrdersCount: 0,
    todayRevenue: null,
  };

  return {
    totalProducts: productStats.totalProducts,
    lowStockCount: productStats.lowStockCount,
    todayOrders: orderStats.todayOrdersCount,
    todayRevenue: orderStats.todayRevenue
      ? parseFloat(orderStats.todayRevenue.toString())
      : 0,
  };
}
