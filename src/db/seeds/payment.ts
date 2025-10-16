import { db } from '@/db';
import { payment } from '@/db/schema';

async function main() {
    const samplePayments = [
        {
            invoiceId: 1,
            amount: 10030,
            paymentDate: new Date('2025-01-08').toISOString(),
            paymentMethod: 'NEFT',
            transactionId: 'TXN202501050001',
            status: 'COMPLETED',
            createdAt: new Date('2025-01-08').toISOString(),
            updatedAt: new Date('2025-01-08').toISOString(),
        },
        {
            invoiceId: 2,
            amount: 14160,
            paymentDate: new Date('2025-01-08').toISOString(),
            paymentMethod: 'RTGS',
            transactionId: 'TXN202501060002',
            status: 'COMPLETED',
            createdAt: new Date('2025-01-08').toISOString(),
            updatedAt: new Date('2025-01-08').toISOString(),
        },
        {
            invoiceId: 3,
            amount: 7965,
            paymentDate: new Date('2025-01-10').toISOString(),
            paymentMethod: 'UPI',
            transactionId: 'UPI2025010712345678',
            status: 'COMPLETED',
            createdAt: new Date('2025-01-10').toISOString(),
            updatedAt: new Date('2025-01-10').toISOString(),
        },
        {
            invoiceId: 4,
            amount: 18172,
            paymentDate: new Date('2025-01-07').toISOString(),
            paymentMethod: 'Cheque',
            transactionId: 'CHQ123456',
            status: 'PENDING',
            createdAt: new Date('2025-01-07').toISOString(),
            updatedAt: new Date('2025-01-07').toISOString(),
        },
        {
            invoiceId: 5,
            amount: 11564,
            paymentDate: new Date('2025-01-08').toISOString(),
            paymentMethod: 'Bank Transfer',
            transactionId: 'TXN202501080005',
            status: 'PENDING',
            createdAt: new Date('2025-01-08').toISOString(),
            updatedAt: new Date('2025-01-08').toISOString(),
        }
    ];

    await db.insert(payment).values(samplePayments);
    
    console.log('✅ Payments seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});