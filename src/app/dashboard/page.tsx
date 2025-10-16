"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, format } from "date-fns";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    expiringSoon: 0,
    pendingRequests: 0,
    totalInvoices: 0,
    recentProducts: [] as any[],
    recentRequests: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [productsRes, requestsRes, invoicesRes] = await Promise.all([
        fetch("/api/products?limit=100", { headers }),
        fetch("/api/requests?limit=10", { headers }),
        fetch("/api/invoices?limit=10", { headers }),
      ]);

      const products = await productsRes.json();
      const requests = await requestsRes.json();
      const invoices = await invoicesRes.json();

      const expiringSoon = products.filter((p: any) => {
        const days = differenceInDays(new Date(p.expiryDate), new Date());
        return days >= 0 && days <= 30;
      }).length;

      const pendingRequests = Array.isArray(requests)
        ? requests.filter((r: any) => r.status === "PENDING").length
        : 0;

      setStats({
        totalProducts: Array.isArray(products) ? products.length : 0,
        expiringSoon,
        pendingRequests,
        totalInvoices: Array.isArray(invoices) ? invoices.length : 0,
        recentProducts: Array.isArray(products) ? products.slice(0, 5) : [],
        recentRequests: Array.isArray(requests) ? requests.slice(0, 5) : [],
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getExpiryColor = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return "text-red-600";
    if (days <= 30) return "text-red-600";
    if (days <= 90) return "text-amber-600";
    return "text-green-600";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: "default",
      CONFIRMED: "secondary",
      COMPLETED: "secondary",
      REJECTED: "destructive",
    };
    return variants[status] || "default";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome to your wholesale marketplace dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">In your inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.expiringSoon}</div>
              <p className="text-xs text-muted-foreground">Within 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground">Generated</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Products */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
            <CardDescription>Your latest inventory additions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentProducts.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No products yet</p>
              ) : (
                stats.recentProducts.map((product: any) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{product.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge variant="outline">{product.batchNumber}</Badge>
                        <span>Qty: {product.quantity}</span>
                        <span>•</span>
                        <span>₹{product.dealerPrice}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getExpiryColor(product.expiryDate)}`}>
                        Exp: {format(new Date(product.expiryDate), "MMM dd, yyyy")}
                      </p>
                      <p className="text-xs text-gray-500">{product.manufacturer}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Marketplace Requests</CardTitle>
            <CardDescription>Latest trading activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentRequests.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No requests yet</p>
              ) : (
                stats.recentRequests.map((request: any) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">Request #{request.id}</p>
                      <p className="text-sm text-gray-500">
                        Product ID: {request.productId} • Qty: {request.quantity}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={getStatusBadge(request.status)}>{request.status}</Badge>
                      <p className="text-xs text-gray-500">
                        {format(new Date(request.requestDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}