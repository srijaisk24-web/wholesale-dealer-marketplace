"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, AlertCircle, Calendar } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Product {
  id: number;
  name: string;
  batchNumber: string;
  quantity: number;
  mrp: number;
  dealerPrice: number;
  expiryDate: string;
  manufacturingDate: string;
  manufacturer: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/products?limit=100", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      // Sort by expiry date (FIFO - First In First Out / First Expiry First Out)
      const sorted = data.sort((a: Product, b: Product) => 
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      );
      setProducts(sorted);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (daysUntilExpiry < 0) {
      return { color: "red", label: "Expired", variant: "destructive" as const };
    } else if (daysUntilExpiry <= 30) {
      return { color: "red", label: `${daysUntilExpiry}d left`, variant: "destructive" as const };
    } else if (daysUntilExpiry <= 90) {
      return { color: "amber", label: `${daysUntilExpiry}d left`, variant: "default" as const };
    } else {
      return { color: "green", label: `${daysUntilExpiry}d left`, variant: "secondary" as const };
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: products.length,
    expiringSoon: products.filter(p => {
      const days = differenceInDays(new Date(p.expiryDate), new Date());
      return days >= 0 && days <= 30;
    }).length,
    expired: products.filter(p => differenceInDays(new Date(p.expiryDate), new Date()) < 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.dealerPrice * p.quantity), 0),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Inventory Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track stock levels with FIFO batch tracking and expiry alerts
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Products</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Expiring Soon (30d)</CardDescription>
              <CardTitle className="text-3xl text-amber-600">
                {stats.expiringSoon}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Expired</CardDescription>
              <CardTitle className="text-3xl text-red-600">{stats.expired}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Value</CardDescription>
              <CardTitle className="text-3xl">
                ₹{stats.totalValue.toLocaleString("en-IN")}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search and Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1 max-w-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>MRP</TableHead>
                      <TableHead>Dealer Price</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Mfg Date</TableHead>
                      <TableHead>Expiry Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => {
                        const expiryStatus = getExpiryStatus(product.expiryDate);
                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{product.batchNumber}</Badge>
                            </TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell>₹{product.mrp.toFixed(2)}</TableCell>
                            <TableCell>₹{product.dealerPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-gray-600">
                              {product.manufacturer}
                            </TableCell>
                            <TableCell>
                              {format(new Date(product.manufacturingDate), "MMM yyyy")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant={expiryStatus.variant}>
                                  {expiryStatus.label}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(product.expiryDate), "MMM dd, yyyy")}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiry Alert Section */}
        {stats.expiringSoon > 0 && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-amber-900 dark:text-amber-100">
                  Expiry Alert
                </CardTitle>
              </div>
              <CardDescription className="text-amber-700 dark:text-amber-300">
                {stats.expiringSoon} product{stats.expiringSoon > 1 ? "s are" : " is"} expiring
                within 30 days. Consider discounting or returning to suppliers.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}