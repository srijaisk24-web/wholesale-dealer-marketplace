import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payment } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const invoiceId = searchParams.get('invoiceId');
    const status = searchParams.get('status');
    const transactionId = searchParams.get('transactionId');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get single payment by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const result = await db
        .select()
        .from(payment)
        .where(eq(payment.id, parseInt(id)))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'Payment not found', code: 'PAYMENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(result[0], { status: 200 });
    }

    // Get payment by transaction ID
    if (transactionId) {
      const result = await db
        .select()
        .from(payment)
        .where(eq(payment.transactionId, transactionId))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'Payment not found', code: 'PAYMENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(result[0], { status: 200 });
    }

    // Build query with filters
    let query = db.select().from(payment);
    const conditions = [];

    // Filter by invoice ID
    if (invoiceId) {
      if (isNaN(parseInt(invoiceId))) {
        return NextResponse.json(
          { error: 'Valid invoice ID is required', code: 'INVALID_INVOICE_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(payment.invoiceId, parseInt(invoiceId)));
    }

    // Filter by status
    if (status) {
      if (!['PENDING', 'COMPLETED'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be PENDING or COMPLETED', code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }
      conditions.push(eq(payment.status, status));
    }

    // Search by transaction ID or payment method
    if (search) {
      const searchCondition = or(
        like(payment.transactionId, `%${search}%`),
        like(payment.paymentMethod, `%${search}%`)
      );
      conditions.push(searchCondition);
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply pagination
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
    const { invoiceId, amount, paymentMethod, transactionId } = body;

    // Validate required fields
    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required', code: 'MISSING_INVOICE_ID' },
        { status: 400 }
      );
    }

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required', code: 'MISSING_AMOUNT' },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required', code: 'MISSING_PAYMENT_METHOD' },
        { status: 400 }
      );
    }

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required', code: 'MISSING_TRANSACTION_ID' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0', code: 'INVALID_AMOUNT' },
        { status: 400 }
      );
    }

    // Check if transaction ID already exists
    const existingPayment = await db
      .select()
      .from(payment)
      .where(eq(payment.transactionId, transactionId))
      .limit(1);

    if (existingPayment.length > 0) {
      return NextResponse.json(
        { error: 'Transaction ID already exists', code: 'DUPLICATE_TRANSACTION_ID' },
        { status: 400 }
      );
    }

    // Create payment with auto-generated fields
    const now = new Date().toISOString();
    const newPayment = await db
      .insert(payment)
      .values({
        invoiceId: parseInt(invoiceId),
        amount: parseFloat(amount),
        paymentMethod: paymentMethod.trim(),
        transactionId: transactionId.trim(),
        paymentDate: now,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newPayment[0], { status: 201 });
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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if payment exists
    const existingPayment = await db
      .select()
      .from(payment)
      .where(eq(payment.id, parseInt(id)))
      .limit(1);

    if (existingPayment.length === 0) {
      return NextResponse.json(
        { error: 'Payment not found', code: 'PAYMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: any = {};

    // Update amount if provided
    if (body.amount !== undefined) {
      if (body.amount <= 0) {
        return NextResponse.json(
          { error: 'Amount must be greater than 0', code: 'INVALID_AMOUNT' },
          { status: 400 }
        );
      }
      updates.amount = parseFloat(body.amount);
    }

    // Update payment method if provided
    if (body.paymentMethod !== undefined) {
      updates.paymentMethod = body.paymentMethod.trim();
    }

    // Update status if provided
    if (body.status !== undefined) {
      if (!['PENDING', 'COMPLETED'].includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be PENDING or COMPLETED', code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    // Always update the updatedAt timestamp
    updates.updatedAt = new Date().toISOString();

    // Perform update
    const updatedPayment = await db
      .update(payment)
      .set(updates)
      .where(eq(payment.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedPayment[0], { status: 200 });
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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if payment exists
    const existingPayment = await db
      .select()
      .from(payment)
      .where(eq(payment.id, parseInt(id)))
      .limit(1);

    if (existingPayment.length === 0) {
      return NextResponse.json(
        { error: 'Payment not found', code: 'PAYMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete payment
    const deletedPayment = await db
      .delete(payment)
      .where(eq(payment.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Payment deleted successfully',
        payment: deletedPayment[0],
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