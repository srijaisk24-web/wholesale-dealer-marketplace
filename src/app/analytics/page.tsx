"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInDays } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    products: [] as any[],
    requests: [] as any[],
    invoices: [] as any[],
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [productsRes, requestsRes, invoicesRes] = await Promise.all([
        fetch("/api/products?limit=100", { headers }),
        fetch("/api/requests?limit=100", { headers }),
        fetch("/api/invoices?limit=100", { headers }),
      ]);

      const products = await productsRes.json();
      const requests = await requestsRes.json();
      const invoices = await invoicesRes.json();

      setData({
        products: Array.isArray(products) ? products : [],
        requests: Array.isArray(requests) ? requests : [],
        invoices: Array.isArray(invoices) ? invoices : [],
      });
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
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

  // Stock Levels by Category
  const stockByManufacturer = data.products.reduce((acc: any, product) => {
    const manufacturer = product.manufacturer;
    if (!acc[manufacturer]) {
      acc[manufacturer] = 0;
    }
    acc[manufacturer] += product.quantity;
    return acc;
  }, {});

  const stockData = Object.entries(stockByManufacturer)
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 6);

  // Expiry Status Distribution
  const expiryData = [
    {
      name: "Expired",
      value: data.products.filter(
        (p) => differenceInDays(new Date(p.expiryDate), new Date()) < 0
      ).length,
      color: "#ef4444",
    },
    {
      name: "Expiring Soon (30d)",
      value: data.products.filter((p) => {
        const days = differenceInDays(new Date(p.expiryDate), new Date());
        return days >= 0 && days <= 30;
      }).length,
      color: "#f59e0b",
    },
    {
      name: "Good (31-90d)",
      value: data.products.filter((p) => {
        const days = differenceInDays(new Date(p.expiryDate), new Date());
        return days > 30 && days <= 90;
      }).length,
      color: "#fbbf24",
    },
    {
      name: "Excellent (>90d)",
      value: data.products.filter((p) => {
        const days = differenceInDays(new Date(p.expiryDate), new Date());
        return days > 90;
      }).length,
      color: "#22c55e",
    },
  ];

  // Request Status Distribution
  const requestStatusData = [
    {
      name: "Pending",
      value: data.requests.filter((r) => r.status === "PENDING").length,
      color: "#3b82f6",
    },
    {
      name: "Confirmed",
      value: data.requests.filter((r) => r.status === "CONFIRMED").length,
      color: "#22c55e",
    },
    {
      name: "Completed",
      value: data.requests.filter((r) => r.status === "COMPLETED").length,
      color: "#6b7280",
    },
    {
      name: "Rejected",
      value: data.requests.filter((r) => r.status === "REJECTED").length,
      color: "#ef4444",
    },
  ];

  // Sales Trends (Monthly)
  const salesTrends = data.invoices.reduce((acc: any, invoice) => {
    const month = new Date(invoice.invoiceDate).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    if (!acc[month]) {
      acc[month] = { month, revenue: 0, count: 0 };
    }
    acc[month].revenue += invoice.total;
    acc[month].count += 1;
    return acc;
  }, {});

  const salesTrendsData = Object.values(salesTrends).sort((a: any, b: any) => {
    return new Date(a.month).getTime() - new Date(b.month).getTime();
  });

  // Inventory Value
  const totalInventoryValue = data.products.reduce(
    (sum, p) => sum + p.dealerPrice * p.quantity,
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Visualize stock levels, expiring items, and sales trends
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Products</CardDescription>
              <CardTitle className="text-3xl">{data.products.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Inventory Value</CardDescription>
              <CardTitle className="text-3xl">
                ₹{totalInventoryValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Requests</CardDescription>
              <CardTitle className="text-3xl">{data.requests.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-3xl">
                ₹
                {data.invoices
                  .reduce((sum, inv) => sum + inv.total, 0)
                  .toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Stock Levels by Manufacturer */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Levels by Manufacturer</CardTitle>
              <CardDescription>Top manufacturers by inventory quantity</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stockData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expiry Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Expiry Status Distribution</CardTitle>
              <CardDescription>Products grouped by expiry timeline</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expiryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expiryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Request Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Request Status Distribution</CardTitle>
              <CardDescription>Marketplace requests by status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={requestStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {requestStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sales Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => `₹${value.toLocaleString("en-IN")}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}