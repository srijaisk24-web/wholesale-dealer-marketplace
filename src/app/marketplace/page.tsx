"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ArrowRight, CheckCircle, XCircle, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Request {
  id: number;
  requestingDealerId: number;
  respondingDealerId: number;
  productId: number;
  quantity: number;
  status: string;
  requestDate: string;
  responseDate?: string;
}

export default function MarketplacePage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/requests?limit=100", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: number, newStatus: string) => {
    setActionLoading(requestId);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/requests?id=${requestId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchRequests();
      }
    } catch (error) {
      console.error("Failed to update request:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; icon: any }> = {
      PENDING: { variant: "default", icon: Clock },
      CONFIRMED: { variant: "secondary", icon: CheckCircle },
      COMPLETED: { variant: "secondary", icon: CheckCircle },
      REJECTED: { variant: "destructive", icon: XCircle },
    };
    const { variant, icon: Icon } = config[status] || config.PENDING;
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const filterByStatus = (status?: string) => {
    if (!status) return requests;
    return requests.filter((r) => r.status === status);
  };

  const renderRequestTable = (filteredRequests: Request[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Request ID</TableHead>
            <TableHead>Product ID</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Requesting Dealer</TableHead>
            <TableHead>Responding Dealer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Request Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRequests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                No requests found
              </TableCell>
            </TableRow>
          ) : (
            filteredRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">#{request.id}</TableCell>
                <TableCell>{request.productId}</TableCell>
                <TableCell>{request.quantity} units</TableCell>
                <TableCell>Dealer #{request.requestingDealerId}</TableCell>
                <TableCell>Dealer #{request.respondingDealerId}</TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>
                  {format(new Date(request.requestDate), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {request.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleStatusUpdate(request.id, "CONFIRMED")}
                          disabled={actionLoading === request.id}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusUpdate(request.id, "REJECTED")}
                          disabled={actionLoading === request.id}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {request.status === "CONFIRMED" && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleStatusUpdate(request.id, "COMPLETED")}
                        disabled={actionLoading === request.id}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                    )}
                    {(request.status === "COMPLETED" || request.status === "REJECTED") && (
                      <span className="text-sm text-gray-500">No actions</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = {
    total: requests.length,
    pending: filterByStatus("PENDING").length,
    confirmed: filterByStatus("CONFIRMED").length,
    completed: filterByStatus("COMPLETED").length,
    rejected: filterByStatus("REJECTED").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dealer Marketplace
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage dealer-to-dealer product requests with workflow tracking
          </p>
        </div>

        {/* Workflow Info */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              Request Workflow
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <Badge variant="default">PENDING</Badge>
                <ArrowRight className="h-4 w-4" />
                <Badge variant="secondary">CONFIRMED</Badge>
                <span className="text-sm">or</span>
                <Badge variant="destructive">REJECTED</Badge>
                <ArrowRight className="h-4 w-4" />
                <Badge variant="secondary">COMPLETED</Badge>
              </div>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Requests</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl text-blue-600">{stats.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Confirmed</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.confirmed}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-3xl text-gray-600">{stats.completed}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rejected</CardDescription>
              <CardTitle className="text-3xl text-red-600">{stats.rejected}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Requests Table with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Marketplace Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed ({stats.confirmed})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                {renderRequestTable(requests)}
              </TabsContent>
              <TabsContent value="pending" className="mt-4">
                {renderRequestTable(filterByStatus("PENDING"))}
              </TabsContent>
              <TabsContent value="confirmed" className="mt-4">
                {renderRequestTable(filterByStatus("CONFIRMED"))}
              </TabsContent>
              <TabsContent value="completed" className="mt-4">
                {renderRequestTable(filterByStatus("COMPLETED"))}
              </TabsContent>
              <TabsContent value="rejected" className="mt-4">
                {renderRequestTable(filterByStatus("REJECTED"))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}