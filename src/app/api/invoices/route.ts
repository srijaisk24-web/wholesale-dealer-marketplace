import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoice } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';

// Helper function to calculate GST amounts
function calculateGST(subtotal: number) {
  const gstAmount = Math.round(subtotal * 0.18 * 100) / 100;
  const total = Math.round((subtotal + gstAmount) * 100) / 100;
  return { gstAmount, total };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const requestId = searchParams.get('requestId');
    const dealerId = searchParams.get('dealerId');
    const buyerDealerId = searchParams.get('buyerDealerId');
    const invoiceNumber = searchParams.get('invoiceNumber');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Single invoice by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const result = await db
        .select()
        .from(invoice)
        .where(eq(invoice.id, parseInt(id)))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'Invoice not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(result[0], { status: 200 });
    }

    // Invoice by request ID
    if (requestId) {
      if (isNaN(parseInt(requestId))) {
        return NextResponse.json(
          { error: 'Valid request ID is required', code: 'INVALID_REQUEST_ID' },
          { status: 400 }
        );
      }

      const result = await db
        .select()
        .from(invoice)
        .where(eq(invoice.requestId, parseInt(requestId)))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'Invoice not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(result[0], { status: 200 });
    }

    // Invoice by invoice number
    if (invoiceNumber) {
      const result = await db
        .select()
        .from(invoice)
        .where(eq(invoice.invoiceNumber, invoiceNumber))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'Invoice not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(result[0], { status: 200 });
    }

    // List invoices with filtering
    let query = db.select().from(invoice);
    const conditions = [];

    // Filter by dealer ID (seller)
    if (dealerId) {
      if (isNaN(parseInt(dealerId))) {
        return NextResponse.json(
          { error: 'Valid dealer ID is required', code: 'INVALID_DEALER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(invoice.dealerId, parseInt(dealerId)));
    }

    // Filter by buyer dealer ID
    if (buyerDealerId) {
      if (isNaN(parseInt(buyerDealerId))) {
        return NextResponse.json(
          { error: 'Valid buyer dealer ID is required', code: 'INVALID_BUYER_DEALER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(invoice.buyerDealerId, parseInt(buyerDealerId)));
    }

    // Search by invoice number
    if (search) {
      conditions.push(like(invoice.invoiceNumber, `%${search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, invoiceNumber, dealerId, buyerDealerId, subtotal } = body;

    // Validate required fields
    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required', code: 'MISSING_REQUEST_ID' },
        { status: 400 }
      );
    }

    if (!invoiceNumber) {
      return NextResponse.json(
        { error: 'Invoice number is required', code: 'MISSING_INVOICE_NUMBER' },
        { status: 400 }
      );
    }

    if (!dealerId) {
      return NextResponse.json(
        { error: 'Dealer ID is required', code: 'MISSING_DEALER_ID' },
        { status: 400 }
      );
    }

    if (!buyerDealerId) {
      return NextResponse.json(
        { error: 'Buyer dealer ID is required', code: 'MISSING_BUYER_DEALER_ID' },
        { status: 400 }
      );
    }

    if (subtotal === undefined || subtotal === null) {
      return NextResponse.json(
        { error: 'Subtotal is required', code: 'MISSING_SUBTOTAL' },
        { status: 400 }
      );
    }

    // Validate subtotal is positive
    if (typeof subtotal !== 'number' || subtotal <= 0) {
      return NextResponse.json(
        { error: 'Subtotal must be a positive number', code: 'INVALID_SUBTOTAL' },
        { status: 400 }
      );
    }

    // Validate IDs are valid integers
    if (isNaN(parseInt(requestId.toString()))) {
      return NextResponse.json(
        { error: 'Valid request ID is required', code: 'INVALID_REQUEST_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(dealerId.toString()))) {
      return NextResponse.json(
        { error: 'Valid dealer ID is required', code: 'INVALID_DEALER_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(buyerDealerId.toString()))) {
      return NextResponse.json(
        { error: 'Valid buyer dealer ID is required', code: 'INVALID_BUYER_DEALER_ID' },
        { status: 400 }
      );
    }

    // Check if invoice number already exists
    const existingInvoice = await db
      .select()
      .from(invoice)
      .where(eq(invoice.invoiceNumber, invoiceNumber.trim()))
      .limit(1);

    if (existingInvoice.length > 0) {
      return NextResponse.json(
        { error: 'Invoice number already exists', code: 'DUPLICATE_INVOICE_NUMBER' },
        { status: 400 }
      );
    }

    // Calculate GST amounts
    const { gstAmount, total } = calculateGST(subtotal);

    // Create invoice
    const currentTimestamp = new Date().toISOString();
    const newInvoice = await db
      .insert(invoice)
      .values({
        requestId: parseInt(requestId.toString()),
        invoiceNumber: invoiceNumber.trim(),
        dealerId: parseInt(dealerId.toString()),
        buyerDealerId: parseInt(buyerDealerId.toString()),
        subtotal: Math.round(subtotal * 100) / 100,
        gstAmount,
        total,
        invoiceDate: currentTimestamp,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      })
      .returning();

    return NextResponse.json(newInvoice[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if invoice exists
    const existingInvoice = await db
      .select()
      .from(invoice)
      .where(eq(invoice.id, parseInt(id)))
      .limit(1);

    if (existingInvoice.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { invoiceNumber, subtotal } = body;

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    // Update invoice number if provided
    if (invoiceNumber !== undefined) {
      const trimmedInvoiceNumber = invoiceNumber.trim();
      
      // Check if new invoice number already exists (excluding current invoice)
      const duplicateInvoice = await db
        .select()
        .from(invoice)
        .where(eq(invoice.invoiceNumber, trimmedInvoiceNumber))
        .limit(1);

      if (duplicateInvoice.length > 0 && duplicateInvoice[0].id !== parseInt(id)) {
        return NextResponse.json(
          { error: 'Invoice number already exists', code: 'DUPLICATE_INVOICE_NUMBER' },
          { status: 400 }
        );
      }

      updates.invoiceNumber = trimmedInvoiceNumber;
    }

    // Update subtotal and recalculate GST if provided
    if (subtotal !== undefined) {
      if (typeof subtotal !== 'number' || subtotal <= 0) {
        return NextResponse.json(
          { error: 'Subtotal must be a positive number', code: 'INVALID_SUBTOTAL' },
          { status: 400 }
        );
      }

      const { gstAmount, total } = calculateGST(subtotal);
      updates.subtotal = Math.round(subtotal * 100) / 100;
      updates.gstAmount = gstAmount;
      updates.total = total;
    }

    const updated = await db
      .update(invoice)
      .set(updates)
      .where(eq(invoice.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if invoice exists
    const existingInvoice = await db
      .select()
      .from(invoice)
      .where(eq(invoice.id, parseInt(id)))
      .limit(1);

    if (existingInvoice.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(invoice)
      .where(eq(invoice.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Invoice deleted successfully',
        invoice: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}