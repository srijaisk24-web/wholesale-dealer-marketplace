# Wholesale Dealer-to-Dealer Marketplace Prototype

A comprehensive wholesale pharmaceutical marketplace platform built with Next.js 15, featuring dealer-to-dealer trading, inventory management, automated invoicing, and analytics.

## 🚀 Features

### 1. **Authentication System**
- Email/password authentication with better-auth
- Protected routes with middleware
- Session management with bearer tokens
- User registration and login pages

### 2. **Inventory Management**
- **FIFO (First In First Out) batch tracking** - Products sorted by expiry date
- **Color-coded expiry alerts**:
  - 🔴 Red: Expired or expiring within 30 days
  - 🟡 Amber: Expiring within 31-90 days
  - 🟢 Green: More than 90 days until expiry
- Real-time stock level tracking
- Batch number management
- Search and filter functionality
- Total inventory value calculation

### 3. **Dealer-to-Dealer Marketplace**
- **Request workflow**: PENDING → CONFIRMED/REJECTED → COMPLETED
- Status-based filtering with tabs
- Request actions (Confirm, Reject, Complete)
- Real-time status updates
- Dealer collaboration interface

### 4. **Invoice Generation**
- **Automatic GST calculation** (18% tax)
- **PDF download functionality** with jsPDF
- GST-compliant invoice format
- Invoice numbering system
- Revenue and GST tracking
- Detailed invoice breakdown

### 5. **Analytics Dashboard**
- **Interactive charts** using Recharts:
  - Bar chart: Stock levels by manufacturer
  - Pie chart: Expiry status distribution
  - Pie chart: Request status distribution
  - Line chart: Sales revenue trends
- Key metrics display
- Inventory value tracking
- Request and revenue analytics

## 📊 Database Schema

### Tables Created:
1. **Dealer** - Business information, GST number, license
2. **Product** - Inventory with batch tracking and expiry dates
3. **Request** - Dealer-to-dealer marketplace requests
4. **Invoice** - GST-compliant invoices with calculations
5. **Payment** - Payment tracking with transaction IDs
6. **User, Session, Account, Verification** - Authentication tables

### Sample Data:
- ✅ 5 Dealers with realistic business details
- ✅ 10 Products with varying expiry dates
- ✅ 10 Marketplace requests in different workflow states
- ✅ 5 Invoices with accurate GST calculations
- ✅ 5 Payments with various payment methods

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Authentication**: better-auth
- **Database**: Turso (SQLite)
- **ORM**: Drizzle ORM
- **UI Components**: Shadcn/UI + Tailwind CSS
- **Charts**: Recharts
- **PDF Generation**: jsPDF + jspdf-autotable
- **Date Handling**: date-fns
- **Icons**: Lucide React

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/page.tsx       # Login page
│   │   └── sign-up/page.tsx       # Registration page
│   ├── api/
│   │   ├── dealers/route.ts       # Dealer CRUD API
│   │   ├── products/route.ts      # Product CRUD API with filters
│   │   ├── requests/route.ts      # Request workflow API
│   │   ├── invoices/route.ts      # Invoice API with GST
│   │   └── payments/route.ts      # Payment tracking API
│   ├── dashboard/page.tsx         # Main dashboard
│   ├── inventory/page.tsx         # Inventory management
│   ├── marketplace/page.tsx       # Dealer marketplace
│   ├── invoices/page.tsx          # Invoice management
│   ├── analytics/page.tsx         # Analytics dashboard
│   └── page.tsx                   # Landing page
├── components/
│   ├── DashboardLayout.tsx        # Main app layout with sidebar
│   └── ui/                        # Shadcn/UI components
├── db/
│   ├── schema.ts                  # Database schema
│   └── seeds/                     # Sample data seeders
└── lib/
    ├── auth.ts                    # Server-side auth
    └── auth-client.ts             # Client-side auth
```

## 🔌 API Endpoints

### Dealers API
- `GET /api/dealers` - List all dealers
- `POST /api/dealers` - Create dealer
- `PUT /api/dealers?id=X` - Update dealer
- `DELETE /api/dealers?id=X` - Delete dealer

### Products API
- `GET /api/products` - List products
- `GET /api/products?nearExpiry=30` - Products expiring in 30 days
- `GET /api/products?batchNumber=X` - Filter by batch
- `POST /api/products` - Create product
- `PUT /api/products?id=X` - Update product
- `DELETE /api/products?id=X` - Delete product

### Requests API
- `GET /api/requests` - List all requests
- `GET /api/requests?status=PENDING` - Filter by status
- `POST /api/requests` - Create request
- `PUT /api/requests?id=X` - Update status (workflow transitions)
- `DELETE /api/requests?id=X` - Delete request

### Invoices API
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice (auto-calculates GST)
- `PUT /api/invoices?id=X` - Update invoice
- `DELETE /api/invoices?id=X` - Delete invoice

### Payments API
- `GET /api/payments` - List payments
- `GET /api/payments?status=COMPLETED` - Filter by status
- `POST /api/payments` - Create payment
- `PUT /api/payments?id=X` - Update payment
- `DELETE /api/payments?id=X` - Delete payment

## 🎨 Key Features Implementation

### 1. FIFO Batch Tracking
```typescript
// Products sorted by expiry date (FIFO)
const sorted = data.sort((a, b) => 
  new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
);
```

### 2. Expiry Color Coding
```typescript
const getExpiryStatus = (expiryDate: string) => {
  const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());
  
  if (daysUntilExpiry < 0 || daysUntilExpiry <= 30) {
    return { color: "red", variant: "destructive" }; // Expired/Critical
  } else if (daysUntilExpiry <= 90) {
    return { color: "amber", variant: "default" }; // Warning
  } else {
    return { color: "green", variant: "secondary" }; // Safe
  }
};
```

### 3. Request Workflow
```typescript
const STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'REJECTED'],
  CONFIRMED: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: []
};
```

### 4. GST Calculation
```typescript
function calculateGST(subtotal: number) {
  const gstAmount = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
  const total = Math.round((subtotal + gstAmount) * 100) / 100;
  return { gstAmount, total };
}
```

### 5. PDF Invoice Generation
```typescript
const generatePDF = (invoice) => {
  const doc = new jsPDF();
  doc.text("TAX INVOICE", 105, 20, { align: "center" });
  // Add invoice details
  autoTable(doc, {
    head: [["Description", "Amount"]],
    body: [
      ["Subtotal", `₹${invoice.subtotal}`],
      ["GST (18%)", `₹${invoice.gstAmount}`],
    ],
  });
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
};
```

## 🔐 Authentication Flow

1. User registers with email/password
2. Better-auth creates user and stores bearer token
3. Token stored in localStorage
4. All API calls include Authorization header
5. Middleware protects routes (/dashboard, /marketplace, etc.)

## 📈 Analytics Calculations

- **Stock by Manufacturer**: Aggregates product quantities
- **Expiry Distribution**: Categorizes products by days until expiry
- **Request Status**: Counts requests by workflow status
- **Sales Trends**: Groups invoices by month for revenue tracking

## 🚦 Getting Started

1. Sign up at `/sign-up`
2. Login at `/sign-in`
3. Access dashboard at `/dashboard`
4. View sample data:
   - 10 products in inventory with varying expiry dates
   - 10 marketplace requests across different statuses
   - 5 invoices with GST calculations
   - 5 payment records

## 🎯 Completed Tasks

✅ Authentication system with protected routes  
✅ Database models with CRUD APIs  
✅ Dealer dashboard with inventory management  
✅ FIFO batch tracking  
✅ Expiry color coding (red/amber/green)  
✅ Marketplace interface with request workflow  
✅ PENDING → CONFIRMED → COMPLETED transitions  
✅ Invoice generation with 18% GST  
✅ PDF download functionality  
✅ Analytics dashboard with interactive charts  

## 📝 Notes

- All monetary values in Indian Rupees (₹)
- GST rate fixed at 18%
- Expiry alerts at 30, 90 day thresholds
- FIFO ensures oldest stock is prioritized
- Color coding provides instant visual feedback
- Workflow prevents invalid status transitions
- PDF invoices are GST-compliant

---

**Built with ❤️ using Next.js 15 and modern web technologies**