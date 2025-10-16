import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { request as requestTable } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'REJECTED'];

const STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'REJECTED'],
  CONFIRMED: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: []
};

function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  if (currentStatus === newStatus) return true;
  return STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');
    const requestingDealerId = searchParams.get('requestingDealerId');
    const respondingDealerId = searchParams.get('respondingDealerId');
    const productId = searchParams.get('productId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const result = await db.select()
        .from(requestTable)
        .where(eq(requestTable.id, parseInt(id)))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json({ 
          error: 'Request not found',
          code: 'REQUEST_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(result[0], { status: 200 });
    }

    let conditions = [];

    if (requestingDealerId) {
      if (isNaN(parseInt(requestingDealerId))) {
        return NextResponse.json({ 
          error: "Valid requesting dealer ID is required",
          code: "INVALID_REQUESTING_DEALER_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(requestTable.requestingDealerId, parseInt(requestingDealerId)));
    }

    if (respondingDealerId) {
      if (isNaN(parseInt(respondingDealerId))) {
        return NextResponse.json({ 
          error: "Valid responding dealer ID is required",
          code: "INVALID_RESPONDING_DEALER_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(requestTable.respondingDealerId, parseInt(respondingDealerId)));
    }

    if (productId) {
      if (isNaN(parseInt(productId))) {
        return NextResponse.json({ 
          error: "Valid product ID is required",
          code: "INVALID_PRODUCT_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(requestTable.productId, parseInt(productId)));
    }

    if (status) {
      if (!VALID_STATUSES.includes(status.toUpperCase())) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      conditions.push(eq(requestTable.status, status.toUpperCase()));
    }

    if (search) {
      const searchCondition = like(requestTable.status, `%${search}%`);
      conditions.push(searchCondition);
    }

    let query = db.select().from(requestTable);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestingDealerId, respondingDealerId, productId, quantity } = body;

    if (!requestingDealerId) {
      return NextResponse.json({ 
        error: "Requesting dealer ID is required",
        code: "MISSING_REQUESTING_DEALER_ID" 
      }, { status: 400 });
    }

    if (!respondingDealerId) {
      return NextResponse.json({ 
        error: "Responding dealer ID is required",
        code: "MISSING_RESPONDING_DEALER_ID" 
      }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ 
        error: "Product ID is required",
        code: "MISSING_PRODUCT_ID" 
      }, { status: 400 });
    }

    if (quantity === undefined || quantity === null) {
      return NextResponse.json({ 
        error: "Quantity is required",
        code: "MISSING_QUANTITY" 
      }, { status: 400 });
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json({ 
        error: "Quantity must be a positive number",
        code: "INVALID_QUANTITY" 
      }, { status: 400 });
    }

    if (requestingDealerId === respondingDealerId) {
      return NextResponse.json({ 
        error: "Requesting dealer cannot be the same as responding dealer",
        code: "SAME_DEALER_ERROR" 
      }, { status: 400 });
    }

    const currentTimestamp = new Date().toISOString();

    const newRequest = await db.insert(requestTable)
      .values({
        requestingDealerId: parseInt(requestingDealerId),
        respondingDealerId: parseInt(respondingDealerId),
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        status: 'PENDING',
        requestDate: currentTimestamp,
        responseDate: null,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp
      })
      .returning();

    return NextResponse.json(newRequest[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const existingRequest = await db.select()
      .from(requestTable)
      .where(eq(requestTable.id, parseInt(id)))
      .limit(1);

    if (existingRequest.length === 0) {
      return NextResponse.json({ 
        error: 'Request not found',
        code: 'REQUEST_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await req.json();
    const { quantity, status: newStatus } = body;

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    if (quantity !== undefined) {
      if (typeof quantity !== 'number' || quantity <= 0) {
        return NextResponse.json({ 
          error: "Quantity must be a positive number",
          code: "INVALID_QUANTITY" 
        }, { status: 400 });
      }
      updates.quantity = parseInt(quantity);
    }

    if (newStatus !== undefined) {
      const upperStatus = newStatus.toUpperCase();
      
      if (!VALID_STATUSES.includes(upperStatus)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }

      const currentStatus = existingRequest[0].status;
      
      if (!isValidStatusTransition(currentStatus, upperStatus)) {
        return NextResponse.json({ 
          error: `Invalid status transition from ${currentStatus} to ${upperStatus}. Valid transitions: ${STATUS_TRANSITIONS[currentStatus].join(', ') || 'None (terminal state)'}`,
          code: "INVALID_STATUS_TRANSITION" 
        }, { status: 400 });
      }

      updates.status = upperStatus;

      if (currentStatus === 'PENDING' && (upperStatus === 'CONFIRMED' || upperStatus === 'REJECTED')) {
        updates.responseDate = new Date().toISOString();
      }
    }

    const updated = await db.update(requestTable)
      .set(updates)
      .where(eq(requestTable.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const existingRequest = await db.select()
      .from(requestTable)
      .where(eq(requestTable.id, parseInt(id)))
      .limit(1);

    if (existingRequest.length === 0) {
      return NextResponse.json({ 
        error: 'Request not found',
        code: 'REQUEST_NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(requestTable)
      .where(eq(requestTable.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Request deleted successfully',
      deleted: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}