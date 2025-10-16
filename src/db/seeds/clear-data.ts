import { db } from '../index';
import { dealer, product, request, invoice, payment } from '../schema';

async function clearData() {
  try {
    console.log('🗑️  Clearing all seeded data...');

    // Delete in reverse order of dependencies
    await db.delete(payment);
    console.log('✓ Cleared payments');

    await db.delete(invoice);
    console.log('✓ Cleared invoices');

    await db.delete(request);
    console.log('✓ Cleared requests');

    await db.delete(product);
    console.log('✓ Cleared products');

    await db.delete(dealer);
    console.log('✓ Cleared dealers');

    console.log('✅ All data cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

clearData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));