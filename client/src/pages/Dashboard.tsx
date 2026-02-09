import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  Plus,
  Eye,
  MessageSquare,
} from "lucide-react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const statsQuery = trpc.dashboard.getStats.useQuery();
  const activityQuery = trpc.dashboard.getActivityFeed.useQuery();

  const stats = statsQuery.data;
  const activities = activityQuery.data || [];

  const activityConfig: Record<string, { icon: string; color: string }> = {
    post_created: { icon: "📝", color: "bg-gray-50 border-gray-200" },
    post_published: { icon: "📤", color: "bg-green-50 border-green-200" },
    order_received: { icon: "📦", color: "bg-blue-50 border-blue-200" },
    order_status_updated: { icon: "✅", color: "bg-gray-50 border-gray-200" },
    stock_updated: { icon: "📊", color: "bg-yellow-50 border-yellow-200" },
  };

  const getActivityConfig = (action: string) =>
    activityConfig[action] || { icon: "📌", color: "bg-gray-50 border-gray-200" };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your business overview.
            </p>
          </div>
          <Button onClick={() => navigate("/posts")} size="lg">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Create Post
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
                  <p className="text-xs text-muted-foreground">Active products</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-red-600">
                    {stats?.lowStockCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Need attention</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Today's Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-500" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.todayOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">New orders</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ৳{(stats?.todayRevenue || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Total revenue</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-auto py-4 justify-start"
            onClick={() => navigate("/posts")}
          >
            <MessageSquare className="mr-3 h-5 w-5" aria-hidden="true" />
            <div className="text-left">
              <div className="font-semibold">Create Post</div>
              <div className="text-xs text-muted-foreground">Post to all platforms</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 justify-start"
            onClick={() => navigate("/inventory")}
          >
            <Package className="mr-3 h-5 w-5" aria-hidden="true" />
            <div className="text-left">
              <div className="font-semibold">Manage Inventory</div>
              <div className="text-xs text-muted-foreground">View and update products</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 justify-start"
            onClick={() => navigate("/orders")}
          >
            <ShoppingCart className="mr-3 h-5 w-5" aria-hidden="true" />
            <div className="text-left">
              <div className="font-semibold">Check Orders</div>
              <div className="text-xs text-muted-foreground">View incoming orders</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 justify-start"
            onClick={() => navigate("/analytics")}
          >
            <Eye className="mr-3 h-5 w-5" aria-hidden="true" />
            <div className="text-left">
              <div className="font-semibold">View Analytics</div>
              <div className="text-xs text-muted-foreground">Sales and performance</div>
            </div>
          </Button>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityQuery.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const { icon, color } = getActivityConfig(activity.action);
                  return (
                    <div
                      key={activity.id}
                      className={`p-4 rounded-lg border-l-4 border-l-primary ${color}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-xl" role="img" aria-label={activity.action}>
                            {icon}
                          </span>
                          <div>
                            <p className="font-medium">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{activity.action}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
