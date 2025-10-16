import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';



// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Wholesale marketplace tables
export const dealer = sqliteTable('dealer', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  businessName: text('business_name').notNull(),
  gstNumber: text('gst_number').notNull().unique(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  licenseNumber: text('license_number').notNull().unique(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const product = sqliteTable('product', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dealerId: integer('dealer_id').notNull().references(() => dealer.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  batchNumber: text('batch_number').notNull(),
  quantity: integer('quantity').notNull(),
  mrp: real('mrp').notNull(),
  dealerPrice: real('dealer_price').notNull(),
  expiryDate: text('expiry_date').notNull(),
  manufacturingDate: text('manufacturing_date').notNull(),
  manufacturer: text('manufacturer').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const request = sqliteTable('request', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  requestingDealerId: integer('requesting_dealer_id').notNull().references(() => dealer.id, { onDelete: 'cascade' }),
  respondingDealerId: integer('responding_dealer_id').notNull().references(() => dealer.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => product.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  status: text('status').notNull().default('PENDING'),
  requestDate: text('request_date').notNull(),
  responseDate: text('response_date'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const invoice = sqliteTable('invoice', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  requestId: integer('request_id').notNull().references(() => request.id, { onDelete: 'cascade' }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  dealerId: integer('dealer_id').notNull().references(() => dealer.id, { onDelete: 'cascade' }),
  buyerDealerId: integer('buyer_dealer_id').notNull().references(() => dealer.id, { onDelete: 'cascade' }),
  subtotal: real('subtotal').notNull(),
  gstAmount: real('gst_amount').notNull(),
  total: real('total').notNull(),
  invoiceDate: text('invoice_date').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const payment = sqliteTable('payment', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id').notNull().references(() => invoice.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  paymentDate: text('payment_date').notNull(),
  paymentMethod: text('payment_method').notNull(),
  transactionId: text('transaction_id').notNull().unique(),
  status: text('status').notNull().default('PENDING'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});