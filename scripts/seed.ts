/**
 * Database Seed Script
 * Populates relational entities with verified initial marketplace data
 */

import { db } from '../src/server/storage/db.ts';
import { Logger } from '../src/server/utils/logger.ts';

async function seedDatabase() {
  console.log('====================================================');
  console.log('            STARTING DATABASE SEED SCRIPT           ');
  console.log('====================================================\n');

  try {
    // Reset and persist initial data
    db.bootstrap();
    console.log('[SUCCESS] Database populated with:');
    console.log(`- ${db.getUsers().length} users`);
    console.log(`- ${db.getMarkets().length} local markets`);
    console.log(`- ${db.getShops().length} verified shops`);
    console.log(`- ${db.getAllProducts().length} inventory products (including Sugar @ ₹100/kg with fractional portions)`);
    console.log(`- ${db.getOrders().length} baseline orders`);
    console.log(`- ${db.getSettlements().length} seller settlements`);
    console.log(`- ${db.getAuditLogs().length} security audit entries`);
    console.log('\n[DONE] Database seeding completed successfully.');
  } catch (err: any) {
    console.error('[ERROR] Seeding failed:', err.message);
    process.exit(1);
  }
}

seedDatabase();
