import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Activity, TrendingUp, ShoppingCart, DollarSign } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";

export default function Analytics() {
  const analyticsQuery = trpc.analytics.getSalesData.useQuery({ days: 30 });
  const platformStatsQuery = trpc.analytics.getPlatformStats.useQuery();

  const analyticsData = analyticsQuery.data || [];
  const platformStats = platformStatsQuery.data || {
    facebook: { orders: 0, revenue: 0 },
    instagram: { orders: 0, revenue: 0 },
    tiktok: { orders: 0, revenue: 0 },
  };

  // Prepare chart data
  const chartData = analyticsData.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    revenue: parseFloat(item.revenue.toString()),
    orders: item.ordersCount,
    posts: item.postsCount,
  }));

  const platformChartData = Object.entries(platformStats).map(
    ([platform, stats]) => ({
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      orders: stats.orders,
      revenue: stats.revenue,
    })
  );

  const platformPieData = Object.entries(platformStats).map(
    ([platform, stats]) => ({
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      value: stats.revenue,
    })
  );

  const COLORS = ["#3b82f6", "#ec4899", "#f59e0b"];

  const totalRevenue = Object.values(platformStats).reduce(
    (sum, stat) => sum + stat.revenue,
    0
  );
  const totalOrders = Object.values(platformStats).reduce(
    (sum, stat) => sum + stat.orders,
    0
  );
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Sales trends and platform performance
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {platformStatsQuery.isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ৳{totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">All platforms</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {platformStatsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalOrders}</div>
                  <p className="text-xs text-muted-foreground">All platforms</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              {platformStatsQuery.isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ৳{avgOrderValue.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">Per order</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Platform</CardTitle>
              <Activity className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {platformStatsQuery.isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {(() => {
                      let best = "N/A";
                      let maxRevenue = 0;
                      Object.entries(platformStats).forEach(
                        ([platform, stats]) => {
                          if (stats.revenue > maxRevenue) {
                            maxRevenue = stats.revenue;
                            best =
                              platform.charAt(0).toUpperCase() +
                              platform.slice(1);
                          }
                        }
                      );
                      return best;
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground">By revenue</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsQuery.isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : chartData.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      name="Revenue (৳)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Platform Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {platformStatsQuery.isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={platformChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="orders"
                      fill="#3b82f6"
                      name="Orders"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="revenue"
                      fill="#10b981"
                      name="Revenue (৳)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Platform</CardTitle>
            </CardHeader>
            <CardContent>
              {platformStatsQuery.isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={platformPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) =>
                        `${name}: ৳${value.toLocaleString()}`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {platformPieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Platform Details */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Details</CardTitle>
            </CardHeader>
            <CardContent>
              {platformStatsQuery.isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(platformStats).map(([platform, stats]) => (
                    <div
                      key={platform}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium capitalize">{platform}</p>
                        <p className="text-sm text-muted-foreground">
                          {stats.orders} orders
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ৳{stats.revenue.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {totalRevenue > 0
                            ? (
                                ((stats.revenue / totalRevenue) * 100).toFixed(
                                  1
                                ) + "%"
                              )
                            : "0%"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
