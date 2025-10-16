import { db } from '@/db';
import { request } from '@/db/schema';

async function main() {
    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    const getRandomDate = (start: Date, end: Date) => {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };
    
    const getRandomDealerId = (exclude?: number) => {
        const dealers = [1, 2, 3, 4, 5];
        const available = exclude ? dealers.filter(d => d !== exclude) : dealers;
        return available[Math.floor(Math.random() * available.length)];
    };
    
    const getRandomProductId = () => Math.floor(Math.random() * 10) + 1;
    const getRandomQuantity = () => Math.floor(Math.random() * 251) + 50;
    
    const addDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };

    const sampleRequests = [
        // PENDING requests (4)
        {
            requestingDealerId: 1,
            respondingDealerId: 3,
            productId: 2,
            quantity: 150,
            status: 'PENDING',
            requestDate: getRandomDate(sixtyDaysAgo, now).toISOString(),
            responseDate: null,
            createdAt: getRandomDate(sixtyDaysAgo, now).toISOString(),
            updatedAt: getRandomDate(sixtyDaysAgo, now).toISOString(),
        },
        {
            requestingDealerId: 4,
            respondingDealerId: 2,
            productId: 7,
            quantity: 200,
            status: 'PENDING',
            requestDate: getRandomDate(sixtyDaysAgo, now).toISOString(),
            responseDate: null,
            createdAt: getRandomDate(sixtyDaysAgo, now).toISOString(),
            updatedAt: getRandomDate(sixtyDaysAgo, now).toISOString(),
        },
        {
            requestingDealerId: 2,
            respondingDealerId: 5,
            productId: 4,
            quantity: 120,
            status: 'PENDING',
            requestDate: getRandomDate(sixtyDaysAgo, now).toISOString(),
            responseDate: null,
            createdAt: getRandomDate(sixtyDaysAgo, now).toISOString(),
            updatedAt: getRandomDate(sixtyDaysAgo, now).toISOString(),
        },
        {
            requestingDealerId: 5,
            respondingDealerId: 1,
            productId: 9,
            quantity: 175,
            status: 'PENDING',
            requestDate: getRandomDate(sixtyDaysAgo, now).toISOString(),
            responseDate: null,
            createdAt: getRandomDate(sixtyDaysAgo, now).toISOString(),
            updatedAt: getRandomDate(sixtyDaysAgo, now).toISOString(),
        },
        // CONFIRMED requests (3)
        {
            requestingDealerId: 3,
            respondingDealerId: 4,
            productId: 1,
            quantity: 250,
            status: 'CONFIRMED',
            requestDate: new Date('2024-11-15T10:30:00Z').toISOString(),
            responseDate: new Date('2024-11-17T14:20:00Z').toISOString(),
            createdAt: new Date('2024-11-15T10:30:00Z').toISOString(),
            updatedAt: new Date('2024-11-17T14:20:00Z').toISOString(),
        },
        {
            requestingDealerId: 1,
            respondingDealerId: 5,
            productId: 6,
            quantity: 180,
            status: 'CONFIRMED',
            requestDate: new Date('2024-11-20T09:15:00Z').toISOString(),
            responseDate: new Date('2024-11-21T16:45:00Z').toISOString(),
            createdAt: new Date('2024-11-20T09:15:00Z').toISOString(),
            updatedAt: new Date('2024-11-21T16:45:00Z').toISOString(),
        },
        {
            requestingDealerId: 4,
            respondingDealerId: 3,
            productId: 8,
            quantity: 290,
            status: 'CONFIRMED',
            requestDate: new Date('2024-11-25T11:00:00Z').toISOString(),
            responseDate: new Date('2024-11-27T10:30:00Z').toISOString(),
            createdAt: new Date('2024-11-25T11:00:00Z').toISOString(),
            updatedAt: new Date('2024-11-27T10:30:00Z').toISOString(),
        },
        // COMPLETED requests (2)
        {
            requestingDealerId: 2,
            respondingDealerId: 1,
            productId: 3,
            quantity: 160,
            status: 'COMPLETED',
            requestDate: new Date('2024-10-10T08:00:00Z').toISOString(),
            responseDate: new Date('2024-10-12T15:30:00Z').toISOString(),
            createdAt: new Date('2024-10-10T08:00:00Z').toISOString(),
            updatedAt: new Date('2024-10-12T15:30:00Z').toISOString(),
        },
        {
            requestingDealerId: 5,
            respondingDealerId: 2,
            productId: 5,
            quantity: 220,
            status: 'COMPLETED',
            requestDate: new Date('2024-10-18T13:45:00Z').toISOString(),
            responseDate: new Date('2024-10-20T09:20:00Z').toISOString(),
            createdAt: new Date('2024-10-18T13:45:00Z').toISOString(),
            updatedAt: new Date('2024-10-20T09:20:00Z').toISOString(),
        },
        // REJECTED request (1)
        {
            requestingDealerId: 3,
            respondingDealerId: 2,
            productId: 10,
            quantity: 85,
            status: 'REJECTED',
            requestDate: new Date('2024-11-05T14:00:00Z').toISOString(),
            responseDate: new Date('2024-11-06T10:15:00Z').toISOString(),
            createdAt: new Date('2024-11-05T14:00:00Z').toISOString(),
            updatedAt: new Date('2024-11-06T10:15:00Z').toISOString(),
        },
    ];

    await db.insert(request).values(sampleRequests);
    
    console.log('✅ Marketplace requests seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});