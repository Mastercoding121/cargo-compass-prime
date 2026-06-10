/* ROUTE_KEY: Admin Products Management */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BRAND } from "@/config/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getMockProducts } from "@/lib/appwrite";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: `Manage Products — ${BRAND.name}` }] }),
  component: AdminProducts,
});

// Appwrite Product type
interface Product {
  $id: string;
  product_id: string;
  title_english: string;
  image_url: string;
  original_1688_link: string;
  price_yuan: number;
  price_naira: number;
  moq: number;
  sales_volume: number;
}

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    price_yuan: 0,
    price_naira: 0,
    moq: 1,
    sales_volume: 0,
  });

  useEffect(() => {
    // Simulate API call to fetch products
    const timer = setTimeout(() => {
      const { products: mockProducts } = getMockProducts({ page: 1, limit: 100 });
      setProducts(mockProducts as unknown as Product[]);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSaveProduct = (product: Product) => {
    if (selectedProduct) {
      setProducts(products.map(p => p.$id === product.$id ? product : p));
      toast.success("Product updated successfully!");
      setIsEditDialogOpen(false);
    }
  };

  const handleAddProduct = () => {
    if (!newProduct.title_english || !newProduct.image_url || !newProduct.original_1688_link) {
      toast.error("Please fill in all required fields");
      return;
    }
    const product: Product = {
      $id: `new_${Date.now()}`,
      product_id: newProduct.product_id || `prod_${Date.now()}`,
      title_english: newProduct.title_english,
      image_url: newProduct.image_url,
      original_1688_link: newProduct.original_1688_link,
      price_yuan: newProduct.price_yuan || 0,
      price_naira: newProduct.price_naira || (newProduct.price_yuan || 0) * 50,
      moq: newProduct.moq || 1,
      sales_volume: newProduct.sales_volume || 0,
    };
    setProducts([product, ...products]);
    toast.success("Product added successfully!");
    setIsAddDialogOpen(false);
    setNewProduct({
      price_yuan: 0,
      price_naira: 0,
      moq: 1,
      sales_volume: 0,
    });
  };

  const handleDeleteProduct = () => {
    if (!selectedProduct) return;
    setProducts(products.filter(p => p.$id !== selectedProduct.$id));
    toast.success("Product deleted successfully!");
    setIsDeleteDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12 text-slate-400">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manage Products</h1>
          <p className="text-slate-500 mt-2">Add, edit, or delete products in the cache</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Price (CNY)</TableHead>
                <TableHead>Price (NGN)</TableHead>
                <TableHead>MOQ</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.$id}>
                  <TableCell>
                    <img
                      src={product.image_url}
                      alt={product.title_english}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {product.title_english}
                  </TableCell>
                  <TableCell>¥{product.price_yuan.toFixed(2)}</TableCell>
                  <TableCell>₦{product.price_naira.toLocaleString()}</TableCell>
                  <TableCell>{product.moq}</TableCell>
                  <TableCell>{product.sales_volume.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Product ID</label>
              <Input
                value={newProduct.product_id || ""}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, product_id: e.target.value })
                }
                placeholder="prod_12345"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={newProduct.title_english || ""}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, title_english: e.target.value })
                }
                placeholder="Product Title"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <Input
                value={newProduct.image_url || ""}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, image_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Original 1688 Link</label>
              <Input
                value={newProduct.original_1688_link || ""}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, original_1688_link: e.target.value })
                }
                placeholder="https://1688.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price (CNY)</label>
              <Input
                type="number"
                value={newProduct.price_yuan}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    price_yuan: parseFloat(e.target.value) || 0,
                    price_naira:
                      newProduct.price_naira ||
                      (parseFloat(e.target.value) || 0) * 50,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price (NGN)</label>
              <Input
                type="number"
                value={newProduct.price_naira}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    price_naira: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">MOQ</label>
              <Input
                type="number"
                min={1}
                value={newProduct.moq}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    moq: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sales Volume</label>
              <Input
                type="number"
                value={newProduct.sales_volume}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    sales_volume: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddProduct}>Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      {selectedProduct && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  defaultValue={selectedProduct.title_english}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      title_english: e.target.value,
                    })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <Input
                  defaultValue={selectedProduct.image_url}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      image_url: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price (CNY)</label>
                <Input
                  type="number"
                  defaultValue={selectedProduct.price_yuan}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      price_yuan: parseFloat(e.target.value) || 0,
                      price_naira:
                        selectedProduct.price_naira ||
                        (parseFloat(e.target.value) || 0) * 50,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price (NGN)</label>
                <Input
                  type="number"
                  defaultValue={selectedProduct.price_naira}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      price_naira: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">MOQ</label>
                <Input
                  type="number"
                  min={1}
                  defaultValue={selectedProduct.moq}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      moq: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sales Volume</label>
                <Input
                  type="number"
                  defaultValue={selectedProduct.sales_volume}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      sales_volume: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button onClick={() => handleSaveProduct(selectedProduct)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Product Dialog */}
      {selectedProduct && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Delete Product
              </DialogTitle>
            </DialogHeader>
            <p className="text-slate-500">
              Are you sure you want to delete "{selectedProduct.title_english}"?
              This action cannot be undone.
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteProduct}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
