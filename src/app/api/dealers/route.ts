import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dealer } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    // Single dealer by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const dealerRecord = await db.select()
        .from(dealer)
        .where(eq(dealer.id, parseInt(id)))
        .limit(1);

      if (dealerRecord.length === 0) {
        return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
      }

      return NextResponse.json(dealerRecord[0], { status: 200 });
    }

    // Dealer by userId
    if (userId) {
      const dealerRecord = await db.select()
        .from(dealer)
        .where(eq(dealer.userId, userId))
        .limit(1);

      if (dealerRecord.length === 0) {
        return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
      }

      return NextResponse.json(dealerRecord[0], { status: 200 });
    }

    // List dealers with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    let query = db.select().from(dealer);

    if (search) {
      const searchCondition = or(
        like(dealer.businessName, `%${search}%`),
        like(dealer.gstNumber, `%${search}%`),
        like(dealer.phone, `%${search}%`)
      );
      
      query = db.select()
        .from(dealer)
        .where(searchCondition);
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { userId, businessName, gstNumber, address, phone, licenseNumber } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: "User ID is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    if (!businessName) {
      return NextResponse.json({ 
        error: "Business name is required",
        code: "MISSING_BUSINESS_NAME" 
      }, { status: 400 });
    }

    if (!gstNumber) {
      return NextResponse.json({ 
        error: "GST number is required",
        code: "MISSING_GST_NUMBER" 
      }, { status: 400 });
    }

    if (!address) {
      return NextResponse.json({ 
        error: "Address is required",
        code: "MISSING_ADDRESS" 
      }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json({ 
        error: "Phone is required",
        code: "MISSING_PHONE" 
      }, { status: 400 });
    }

    if (!licenseNumber) {
      return NextResponse.json({ 
        error: "License number is required",
        code: "MISSING_LICENSE_NUMBER" 
      }, { status: 400 });
    }

    // Check if GST number already exists
    const existingGst = await db.select()
      .from(dealer)
      .where(eq(dealer.gstNumber, gstNumber.trim()))
      .limit(1);

    if (existingGst.length > 0) {
      return NextResponse.json({ 
        error: "GST number already exists",
        code: "DUPLICATE_GST_NUMBER" 
      }, { status: 400 });
    }

    // Check if license number already exists
    const existingLicense = await db.select()
      .from(dealer)
      .where(eq(dealer.licenseNumber, licenseNumber.trim()))
      .limit(1);

    if (existingLicense.length > 0) {
      return NextResponse.json({ 
        error: "License number already exists",
        code: "DUPLICATE_LICENSE_NUMBER" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    const newDealer = await db.insert(dealer)
      .values({
        userId: userId,
        businessName: businessName.trim(),
        gstNumber: gstNumber.trim(),
        address: address.trim(),
        phone: phone.trim(),
        licenseNumber: licenseNumber.trim(),
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newDealer[0], { status: 201 });
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

    const body = await request.json();

    // Check if dealer exists
    const existingDealer = await db.select()
      .from(dealer)
      .where(eq(dealer.id, parseInt(id)))
      .limit(1);

    if (existingDealer.length === 0) {
      return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
    }

    const { businessName, gstNumber, address, phone, licenseNumber } = body;

    // If gstNumber is being updated, check for uniqueness
    if (gstNumber && gstNumber !== existingDealer[0].gstNumber) {
      const duplicateGst = await db.select()
        .from(dealer)
        .where(eq(dealer.gstNumber, gstNumber.trim()))
        .limit(1);

      if (duplicateGst.length > 0) {
        return NextResponse.json({ 
          error: "GST number already exists",
          code: "DUPLICATE_GST_NUMBER" 
        }, { status: 400 });
      }
    }

    // If licenseNumber is being updated, check for uniqueness
    if (licenseNumber && licenseNumber !== existingDealer[0].licenseNumber) {
      const duplicateLicense = await db.select()
        .from(dealer)
        .where(eq(dealer.licenseNumber, licenseNumber.trim()))
        .limit(1);

      if (duplicateLicense.length > 0) {
        return NextResponse.json({ 
          error: "License number already exists",
          code: "DUPLICATE_LICENSE_NUMBER" 
        }, { status: 400 });
      }
    }

    const updates: Record<string, string> = {
      updatedAt: new Date().toISOString()
    };

    if (businessName) updates.businessName = businessName.trim();
    if (gstNumber) updates.gstNumber = gstNumber.trim();
    if (address) updates.address = address.trim();
    if (phone) updates.phone = phone.trim();
    if (licenseNumber) updates.licenseNumber = licenseNumber.trim();

    const updated = await db.update(dealer)
      .set(updates)
      .where(eq(dealer.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
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

    // Check if dealer exists
    const existingDealer = await db.select()
      .from(dealer)
      .where(eq(dealer.id, parseInt(id)))
      .limit(1);

    if (existingDealer.length === 0) {
      return NextResponse.json({ error: 'Dealer not found' }, { status: 404 });
    }

    const deleted = await db.delete(dealer)
      .where(eq(dealer.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Dealer deleted successfully',
      dealer: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}