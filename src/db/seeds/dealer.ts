import { db } from '@/db';
import { dealer } from '@/db/schema';

async function main() {
    const sampleDealers = [
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            businessName: 'MediSupply Distributors',
            gstNumber: '27AABCU9603R1ZM',
            address: '123, Medical Complex, MG Road, Mumbai, Maharashtra - 400001',
            phone: '9876543210',
            licenseNumber: 'MH-20A-12345',
            createdAt: new Date('2024-08-15').toISOString(),
            updatedAt: new Date('2024-08-15').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r5',
            businessName: 'PharmaCare Wholesale',
            gstNumber: '29BBCDE1234F1Z5',
            address: '456, Healthcare Plaza, Brigade Road, Bangalore, Karnataka - 560001',
            phone: '8765432109',
            licenseNumber: 'KA-21B-67890',
            createdAt: new Date('2024-09-10').toISOString(),
            updatedAt: new Date('2024-09-10').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r6',
            businessName: 'HealthFirst Traders',
            gstNumber: '07CDFGH5678K2A1',
            address: '789, Pharma Hub, Connaught Place, New Delhi, Delhi - 110001',
            phone: '7654321098',
            licenseNumber: 'DL-22C-34567',
            createdAt: new Date('2024-10-05').toISOString(),
            updatedAt: new Date('2024-10-05').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r7',
            businessName: 'MedPlus Distribution',
            gstNumber: '36EFGHI9012M3B2',
            address: '321, Medical Square, Park Street, Hyderabad, Telangana - 500001',
            phone: '9543210987',
            licenseNumber: 'TS-23D-89012',
            createdAt: new Date('2024-11-20').toISOString(),
            updatedAt: new Date('2024-11-20').toISOString(),
        },
        {
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r8',
            businessName: 'Wellness Pharma Suppliers',
            gstNumber: '24GHIJK3456N4C3',
            address: '654, Healthcare Center, SG Highway, Ahmedabad, Gujarat - 380001',
            phone: '8432109876',
            licenseNumber: 'GJ-24E-45678',
            createdAt: new Date('2024-12-01').toISOString(),
            updatedAt: new Date('2024-12-01').toISOString(),
        },
    ];

    await db.insert(dealer).values(sampleDealers);
    
    console.log('✅ Dealers seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});