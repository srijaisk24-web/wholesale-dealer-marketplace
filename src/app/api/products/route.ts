import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { product, dealer } from '@/db/schema';
import { eq, like, or, and, lte, gte, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const dealerId = searchParams.get('dealerId');
    const batchNumber = searchParams.get('batchNumber');
    const expiringBefore = searchParams.get('expiringBefore');
    const expiringAfter = searchParams.get('expiringAfter');
    const nearExpiry = searchParams.get('nearExpiry');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Single product by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const products = await db.select()
        .from(product)
        .where(eq(product.id, parseInt(id)))
        .limit(1);

      if (products.length === 0) {
        return NextResponse.json({ 
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(products[0], { status: 200 });
    }

    // List products with filtering
    let query = db.select().from(product);
    const conditions = [];

    // Dealer filter
    if (dealerId) {
      if (isNaN(parseInt(dealerId))) {
        return NextResponse.json({ 
          error: "Valid dealer ID is required",
          code: "INVALID_DEALER_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(product.dealerId, parseInt(dealerId)));
    }

    // Batch number filter
    if (batchNumber) {
      conditions.push(eq(product.batchNumber, batchNumber));
    }

    // Expiry date filters
    if (expiringBefore) {
      // Validate ISO date format
      if (isNaN(Date.parse(expiringBefore))) {
        return NextResponse.json({ 
          error: "Invalid date format for expiringBefore. Use ISO format (YYYY-MM-DD)",
          code: "INVALID_DATE_FORMAT" 
        }, { status: 400 });
      }
      conditions.push(lte(product.expiryDate, expiringBefore));
    }

    if (expiringAfter) {
      // Validate ISO date format
      if (isNaN(Date.parse(expiringAfter))) {
        return NextResponse.json({ 
          error: "Invalid date format for expiringAfter. Use ISO format (YYYY-MM-DD)",
          code: "INVALID_DATE_FORMAT" 
        }, { status: 400 });
      }
      conditions.push(gte(product.expiryDate, expiringAfter));
    }

    // Near expiry filter (products expiring within X days from today)
    if (nearExpiry) {
      const days = parseInt(nearExpiry);
      if (isNaN(days) || days < 0) {
        return NextResponse.json({ 
          error: "nearExpiry must be a positive number",
          code: "INVALID_NEAR_EXPIRY" 
        }, { status: 400 });
      }

      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + days);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      conditions.push(
        and(
          gte(product.expiryDate, today.toISOString().split('T')[0]),
          lte(product.expiryDate, futureDateStr)
        )
      );
    }

    // Search filter (name, batchNumber, or manufacturer)
    if (search) {
      const searchCondition = or(
        like(product.name, `%${search}%`),
        like(product.batchNumber, `%${search}%`),
        like(product.manufacturer, `%${search}%`)
      );
      conditions.push(searchCondition);
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply ordering, limit, and offset
    const products = await query
      .orderBy(desc(product.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(products, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      dealerId, 
      name, 
      batchNumber, 
      quantity, 
      mrp, 
      dealerPrice, 
      expiryDate, 
      manufacturingDate, 
      manufacturer 
    } = body;

    // Validate required fields
    if (!dealerId) {
      return NextResponse.json({ 
        error: "dealerId is required",
        code: "MISSING_DEALER_ID" 
      }, { status: 400 });
    }

    if (!name || name.trim() === '') {
      return NextResponse.json({ 
        error: "name is required",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!batchNumber || batchNumber.trim() === '') {
      return NextResponse.json({ 
        error: "batchNumber is required",
        code: "MISSING_BATCH_NUMBER" 
      }, { status: 400 });
    }

    if (quantity === undefined || quantity === null) {
      return NextResponse.json({ 
        error: "quantity is required",
        code: "MISSING_QUANTITY" 
      }, { status: 400 });
    }

    if (!mrp) {
      return NextResponse.json({ 
        error: "mrp is required",
        code: "MISSING_MRP" 
      }, { status: 400 });
    }

    if (!dealerPrice) {
      return NextResponse.json({ 
        error: "dealerPrice is required",
        code: "MISSING_DEALER_PRICE" 
      }, { status: 400 });
    }

    if (!expiryDate || expiryDate.trim() === '') {
      return NextResponse.json({ 
        error: "expiryDate is required",
        code: "MISSING_EXPIRY_DATE" 
      }, { status: 400 });
    }

    if (!manufacturingDate || manufacturingDate.trim() === '') {
      return NextResponse.json({ 
        error: "manufacturingDate is required",
        code: "MISSING_MANUFACTURING_DATE" 
      }, { status: 400 });
    }

    if (!manufacturer || manufacturer.trim() === '') {
      return NextResponse.json({ 
        error: "manufacturer is required",
        code: "MISSING_MANUFACTURER" 
      }, { status: 400 });
    }

    // Validate data types and values
    if (isNaN(parseInt(dealerId))) {
      return NextResponse.json({ 
        error: "dealerId must be a valid integer",
        code: "INVALID_DEALER_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(quantity)) || parseInt(quantity) < 0) {
      return NextResponse.json({ 
        error: "quantity must be a non-negative integer",
        code: "INVALID_QUANTITY" 
      }, { status: 400 });
    }

    if (isNaN(parseFloat(mrp)) || parseFloat(mrp) <= 0) {
      return NextResponse.json({ 
        error: "mrp must be greater than 0",
        code: "INVALID_MRP" 
      }, { status: 400 });
    }

    if (isNaN(parseFloat(dealerPrice)) || parseFloat(dealerPrice) <= 0) {
      return NextResponse.json({ 
        error: "dealerPrice must be greater than 0",
        code: "INVALID_DEALER_PRICE" 
      }, { status: 400 });
    }

    // Validate date formats
    if (isNaN(Date.parse(expiryDate))) {
      return NextResponse.json({ 
        error: "expiryDate must be a valid ISO date",
        code: "INVALID_EXPIRY_DATE" 
      }, { status: 400 });
    }

    if (isNaN(Date.parse(manufacturingDate))) {
      return NextResponse.json({ 
        error: "manufacturingDate must be a valid ISO date",
        code: "INVALID_MANUFACTURING_DATE" 
      }, { status: 400 });
    }

    // Validate expiry date is after manufacturing date
    if (new Date(expiryDate) <= new Date(manufacturingDate)) {
      return NextResponse.json({ 
        error: "expiryDate must be after manufacturingDate",
        code: "INVALID_DATE_RANGE" 
      }, { status: 400 });
    }

    // Check if dealer exists
    const dealers = await db.select()
      .from(dealer)
      .where(eq(dealer.id, parseInt(dealerId)))
      .limit(1);

    if (dealers.length === 0) {
      return NextResponse.json({ 
        error: "Dealer not found",
        code: "DEALER_NOT_FOUND" 
      }, { status: 400 });
    }

    // Create product
    const now = new Date().toISOString();
    const newProduct = await db.insert(product)
      .values({
        dealerId: parseInt(dealerId),
        name: name.trim(),
        batchNumber: batchNumber.trim(),
        quantity: parseInt(quantity),
        mrp: parseFloat(mrp),
        dealerPrice: parseFloat(dealerPrice),
        expiryDate: expiryDate.trim(),
        manufacturingDate: manufacturingDate.trim(),
        manufacturer: manufacturer.trim(),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newProduct[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if product exists
    const existingProducts = await db.select()
      .from(product)
      .where(eq(product.id, parseInt(id)))
      .limit(1);

    if (existingProducts.length === 0) {
      return NextResponse.json({ 
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const updates: any = {};

    // Validate and prepare updates
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim() === '') {
        return NextResponse.json({ 
          error: "name must be a non-empty string",
          code: "INVALID_NAME" 
        }, { status: 400 });
      }
      updates.name = body.name.trim();
    }

    if (body.batchNumber !== undefined) {
      if (typeof body.batchNumber !== 'string' || body.batchNumber.trim() === '') {
        return NextResponse.json({ 
          error: "batchNumber must be a non-empty string",
          code: "INVALID_BATCH_NUMBER" 
        }, { status: 400 });
      }
      updates.batchNumber = body.batchNumber.trim();
    }

    if (body.quantity !== undefined) {
      if (isNaN(parseInt(body.quantity)) || parseInt(body.quantity) < 0) {
        return NextResponse.json({ 
          error: "quantity must be a non-negative integer",
          code: "INVALID_QUANTITY" 
        }, { status: 400 });
      }
      updates.quantity = parseInt(body.quantity);
    }

    if (body.mrp !== undefined) {
      if (isNaN(parseFloat(body.mrp)) || parseFloat(body.mrp) <= 0) {
        return NextResponse.json({ 
          error: "mrp must be greater than 0",
          code: "INVALID_MRP" 
        }, { status: 400 });
      }
      updates.mrp = parseFloat(body.mrp);
    }

    if (body.dealerPrice !== undefined) {
      if (isNaN(parseFloat(body.dealerPrice)) || parseFloat(body.dealerPrice) <= 0) {
        return NextResponse.json({ 
          error: "dealerPrice must be greater than 0",
          code: "INVALID_DEALER_PRICE" 
        }, { status: 400 });
      }
      updates.dealerPrice = parseFloat(body.dealerPrice);
    }

    if (body.expiryDate !== undefined) {
      if (isNaN(Date.parse(body.expiryDate))) {
        return NextResponse.json({ 
          error: "expiryDate must be a valid ISO date",
          code: "INVALID_EXPIRY_DATE" 
        }, { status: 400 });
      }
      updates.expiryDate = body.expiryDate.trim();
    }

    if (body.manufacturingDate !== undefined) {
      if (isNaN(Date.parse(body.manufacturingDate))) {
        return NextResponse.json({ 
          error: "manufacturingDate must be a valid ISO date",
          code: "INVALID_MANUFACTURING_DATE" 
        }, { status: 400 });
      }
      updates.manufacturingDate = body.manufacturingDate.trim();
    }

    if (body.manufacturer !== undefined) {
      if (typeof body.manufacturer !== 'string' || body.manufacturer.trim() === '') {
        return NextResponse.json({ 
          error: "manufacturer must be a non-empty string",
          code: "INVALID_MANUFACTURER" 
        }, { status: 400 });
      }
      updates.manufacturer = body.manufacturer.trim();
    }

    // Validate date range if both dates are being updated or one is being updated
    const finalExpiryDate = updates.expiryDate || existingProducts[0].expiryDate;
    const finalManufacturingDate = updates.manufacturingDate || existingProducts[0].manufacturingDate;

    if (new Date(finalExpiryDate) <= new Date(finalManufacturingDate)) {
      return NextResponse.json({ 
        error: "expiryDate must be after manufacturingDate",
        code: "INVALID_DATE_RANGE" 
      }, { status: 400 });
    }

    // Update product
    updates.updatedAt = new Date().toISOString();

    const updatedProduct = await db.update(product)
      .set(updates)
      .where(eq(product.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedProduct[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if product exists
    const existingProducts = await db.select()
      .from(product)
      .where(eq(product.id, parseInt(id)))
      .limit(1);

    if (existingProducts.length === 0) {
      return NextResponse.json({ 
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete product
    const deleted = await db.delete(product)
      .where(eq(product.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Product deleted successfully',
      product: deleted[0] 
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}