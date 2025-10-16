import { db } from '@/db';
import { invoice } from '@/db/schema';

async function main() {
    const sampleInvoices = [
        {
            requestId: 5,
            invoiceNumber: 'INV-2025-001',
            dealerId: 2,
            buyerDealerId: 1,
            subtotal: 8500.00,
            gstAmount: 1530.00,
            total: 10030.00,
            invoiceDate: new Date('2025-01-05').toISOString(),
            createdAt: new Date('2025-01-05').toISOString(),
            updatedAt: new Date('2025-01-05').toISOString(),
        },
        {
            requestId: 6,
            invoiceNumber: 'INV-2025-002',
            dealerId: 4,
            buyerDealerId: 3,
            subtotal: 12000.00,
            gstAmount: 2160.00,
            total: 14160.00,
            invoiceDate: new Date('2025-01-10').toISOString(),
            createdAt: new Date('2025-01-10').toISOString(),
            updatedAt: new Date('2025-01-10').toISOString(),
        },
        {
            requestId: 7,
            invoiceNumber: 'INV-2025-003',
            dealerId: 1,
            buyerDealerId: 5,
            subtotal: 6750.00,
            gstAmount: 1215.00,
            total: 7965.00,
            invoiceDate: new Date('2025-01-15').toISOString(),
            createdAt: new Date('2025-01-15').toISOString(),
            updatedAt: new Date('2025-01-15').toISOString(),
        },
        {
            requestId: 8,
            invoiceNumber: 'INV-2025-004',
            dealerId: 5,
            buyerDealerId: 2,
            subtotal: 15400.00,
            gstAmount: 2772.00,
            total: 18172.00,
            invoiceDate: new Date('2025-01-20').toISOString(),
            createdAt: new Date('2025-01-20').toISOString(),
            updatedAt: new Date('2025-01-20').toISOString(),
        },
        {
            requestId: 9,
            invoiceNumber: 'INV-2025-005',
            dealerId: 3,
            buyerDealerId: 4,
            subtotal: 9800.00,
            gstAmount: 1764.00,
            total: 11564.00,
            invoiceDate: new Date('2025-01-25').toISOString(),
            createdAt: new Date('2025-01-25').toISOString(),
            updatedAt: new Date('2025-01-25').toISOString(),
        }
    ];

    await db.insert(invoice).values(sampleInvoices);
    
    console.log('✅ Invoices seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});