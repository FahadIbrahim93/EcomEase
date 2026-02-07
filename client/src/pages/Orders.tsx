import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  FileText,
  CheckCircle,
  Clock,
  Truck,
  Download,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Orders() {
  const ordersQuery = trpc.orders.list.useQuery({ status: undefined });
  const updateStatusMutation = trpc.orders.updateStatus.useMutation();
  const createInvoiceMutation = trpc.invoices.create.useMutation();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: orderId,
        status: newStatus as any,
      });
      toast.success("Order status updated!");
      ordersQuery.refetch();
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const handleGenerateInvoice = async (order: any) => {
    try {
      const invoiceNumber = `INV-${Date.now()}`;
      await createInvoiceMutation.mutateAsync({
        orderId: order.id,
        invoiceNumber,
        subtotal: order.totalAmount,
        tax: "0",
        discount: "0",
        total: order.totalAmount,
        notes: `Order #${order.orderNumber}`,
      });
      toast.success("Invoice generated!");
    } catch (error) {
      toast.error("Failed to generate invoice");
    }
  };

  const orders = ordersQuery.data || [];
  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "shipped":
        return <Truck className="h-4 w-4 text-blue-500" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return "f";
      case "instagram":
        return "📷";
      case "tiktok":
        return "🎵";
      default:
        return "📦";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage orders from all platforms
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersQuery.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          #{order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {getPlatformIcon(order.platform)} {order.platform}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.customerPhone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ৳{order.totalAmount}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(order.status)}
                            <Select
                              value={order.status}
                              onValueChange={(value) =>
                                handleStatusChange(order.id, value)
                              }
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="processing">
                                  Processing
                                </SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">
                                  Delivered
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  Cancelled
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>
                                    Order #{order.orderNumber}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">
                                        Customer
                                      </p>
                                      <p className="font-medium">
                                        {order.customerName}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">
                                        Platform
                                      </p>
                                      <p className="font-medium capitalize">
                                        {order.platform}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Shipping Address
                                    </p>
                                    <p className="font-medium">
                                      {order.shippingAddress || "Not provided"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      Items
                                    </p>
                                    <div className="space-y-2">
                                      {(() => {
                                        try {
                                          const itemsStr = typeof order.items === 'string' ? order.items : '[]';
                                          const items = JSON.parse(itemsStr) as any[];
                                          return items.map((item, idx) => (
                                            <div
                                              key={idx}
                                              className="flex justify-between text-sm"
                                            >
                                              <span>
                                                Product #{item.productId} x
                                                {item.quantity}
                                              </span>
                                              <span>৳{item.price}</span>
                                            </div>
                                          ));
                                        } catch {
                                          return (
                                            <p className="text-muted-foreground">
                                              No items
                                            </p>
                                          );
                                        }
                                      })()}
                                    </div>
                                  </div>
                                  <div className="border-t pt-4">
                                    <div className="flex justify-between font-semibold">
                                      <span>Total</span>
                                      <span>৳{order.totalAmount}</span>
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() =>
                                      handleGenerateInvoice(order)
                                    }
                                    className="w-full"
                                    disabled={
                                      createInvoiceMutation.isPending
                                    }
                                  >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Generate Invoice
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateInvoice(order)}
                              disabled={createInvoiceMutation.isPending}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
