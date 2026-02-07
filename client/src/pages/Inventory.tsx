import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Inventory() {
  const productsQuery = trpc.products.list.useQuery();
  const createProductMutation = trpc.products.create.useMutation();
  const updateProductMutation = trpc.products.update.useMutation();
  const deleteProductMutation = trpc.products.delete.useMutation();
  const adjustStockMutation = trpc.products.adjustStock.useMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    costPrice: "",
    stockQuantity: 0,
    lowStockThreshold: 5,
    sku: "",
    category: "",
  });

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price,
        costPrice: product.costPrice || "",
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        sku: product.sku || "",
        category: product.category || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        costPrice: "",
        stockQuantity: 0,
        lowStockThreshold: 5,
        sku: "",
        category: "",
      });
    }
    setIsOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      if (editingId) {
        await updateProductMutation.mutateAsync({
          id: editingId,
          ...formData,
        });
        toast.success("Product updated!");
      } else {
        await createProductMutation.mutateAsync(formData);
        toast.success("Product created!");
      }
      setIsOpen(false);
      productsQuery.refetch();
    } catch (error) {
      toast.error("Failed to save product");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) {
      try {
        await deleteProductMutation.mutateAsync({ id });
        toast.success("Product deleted!");
        productsQuery.refetch();
      } catch (error) {
        toast.error("Failed to delete product");
      }
    }
  };

  const handleAdjustStock = async (id: number, adjustment: number) => {
    try {
      await adjustStockMutation.mutateAsync({ id, adjustment });
      toast.success("Stock updated!");
      productsQuery.refetch();
    } catch (error) {
      toast.error("Failed to adjust stock");
    }
  };

  const products = productsQuery.data || [];
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const lowStockProducts = filteredProducts.filter(
    (p) => p.stockQuantity <= p.lowStockThreshold
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Inventory</h1>
            <p className="text-muted-foreground mt-1">
              Manage your products and stock levels
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="lg" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Product" : "Add New Product"}
                </DialogTitle>
                <DialogDescription>
                  {editingId
                    ? "Update product details"
                    : "Add a new product to your inventory"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Product Name *</Label>
                    <Input
                      placeholder="e.g., Gold Necklace"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>SKU</Label>
                    <Input
                      placeholder="e.g., GN-001"
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData({ ...formData, sku: e.target.value })
                      }
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Input
                    placeholder="Product description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Input
                      placeholder="e.g., Jewelry"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Price *</Label>
                    <Input
                      placeholder="৳ 1500"
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cost Price</Label>
                    <Input
                      placeholder="৳ 800"
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, costPrice: e.target.value })
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Stock Quantity</Label>
                    <Input
                      placeholder="0"
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stockQuantity: parseInt(e.target.value) || 0,
                        })
                      }
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label>Low Stock Threshold</Label>
                  <Input
                    placeholder="5"
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lowStockThreshold: parseInt(e.target.value) || 5,
                      })
                    }
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProduct}
                    disabled={
                      createProductMutation.isPending ||
                      updateProductMutation.isPending
                    }
                  >
                    {createProductMutation.isPending ||
                    updateProductMutation.isPending
                      ? "Saving..."
                      : "Save Product"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div>
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">
                  {lowStockProducts.length} product
                  {lowStockProducts.length !== 1 ? "s" : ""} running low on
                  stock
                </p>
                <p className="text-sm text-yellow-700">
                  Consider restocking these items
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Products ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {productsQuery.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No products found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>{product.category || "-"}</TableCell>
                        <TableCell>৳{product.price}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{product.stockQuantity}</span>
                            {product.stockQuantity <=
                              product.lowStockThreshold && (
                              <Badge variant="destructive" className="text-xs">
                                Low
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDialog(product)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(product.id)}
                              disabled={deleteProductMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
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
