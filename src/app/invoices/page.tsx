"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Invoice {
  id: number;
  invoiceNumber: string;
  requestId: number;
  dealerId: number;
  buyerDealerId: number;
  subtotal: number;
  gstAmount: number;
  total: number;
  invoiceDate: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/invoices?limit=100", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (invoice: Invoice) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 105, 20, { align: "center" });

    // Invoice details
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, 20, 40);
    doc.text(`Date: ${format(new Date(invoice.invoiceDate), "dd MMM yyyy")}`, 20, 46);
    doc.text(`Request ID: ${invoice.requestId}`, 20, 52);

    // Seller & Buyer info
    doc.setFont("helvetica", "bold");
    doc.text("Seller:", 20, 65);
    doc.setFont("helvetica", "normal");
    doc.text(`Dealer ID: ${invoice.dealerId}`, 20, 71);

    doc.setFont("helvetica", "bold");
    doc.text("Buyer:", 120, 65);
    doc.setFont("helvetica", "normal");
    doc.text(`Dealer ID: ${invoice.buyerDealerId}`, 120, 71);

    // Items table
    autoTable(doc, {
      startY: 85,
      head: [["Description", "Amount"]],
      body: [
        ["Subtotal", `₹${invoice.subtotal.toFixed(2)}`],
        ["GST (18%)", `₹${invoice.gstAmount.toFixed(2)}`],
      ],
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] },
    });

    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 110;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Total Amount:", 120, finalY + 10);
    doc.text(`₹${invoice.total.toFixed(2)}`, 170, finalY + 10);

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("This is a computer-generated invoice.", 105, 280, { align: "center" });

    // Save PDF
    doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
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

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalGST = invoices.reduce((sum, inv) => sum + inv.gstAmount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invoices</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View and download GST-compliant invoices with 18% tax calculation
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">Total Invoices</div>
                <FileText className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">Total Revenue</div>
                <FileText className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString("en-IN")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">Total GST (18%)</div>
                <FileText className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalGST.toLocaleString("en-IN")}</div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>GST (18%)</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>#{invoice.requestId}</TableCell>
                        <TableCell>Dealer #{invoice.dealerId}</TableCell>
                        <TableCell>Dealer #{invoice.buyerDealerId}</TableCell>
                        <TableCell>₹{invoice.subtotal.toFixed(2)}</TableCell>
                        <TableCell className="text-amber-600">
                          ₹{invoice.gstAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₹{invoice.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.invoiceDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generatePDF(invoice)}
                          >
                            <Download className="h-3 w-3 mr-2" />
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}