/**
 * Phase 7 Persistence & Resilience Test
 * Verifies data survival across server restarts and price mutation immutability
 */

import fs from 'fs';
import path from 'path';
import { db } from '../src/server/storage/db.ts';
import { OrderService } from '../src/server/services/order.service.ts';
import { PaymentService } from '../src/server/services/payment.service.ts';
import { FulfillmentType, OrderStatus } from '../src/types/order.ts';
import { UserRole } from '../src/types/auth.ts';

async function testPersistence() {
  console.log('====================================================');
  console.log('      RUNNING PHASE 7 DATABASE PERSISTENCE TEST     ');
  console.log('====================================================\n');

  // Reset to clean seed
  db.bootstrap();

  const customer = db.getUserById('usr_cust_01')!;
  const shop = db.getShopById('shp_krishna_grocers')!;
  const sugarProduct = db.getProductById('prd_sugar_m30')!;

  console.log(`[INITIAL] Sugar base price: ₹${sugarProduct.fractionalConfig.basePrice}/kg, Stock: ${sugarProduct.currentStockInBaseUnits} kg`);

  // 1. Create order for 500g of sugar @ ₹50
  const order = OrderService.createOrder(customer, {
    shopId: shop.id,
    fulfillmentType: FulfillmentType.STORE_PICKUP,
    items: [
      {
        productId: sugarProduct.id,
        requestedMultiplier: 0.5, // 500g
        quantityCount: 1,
      },
    ],
  });

  // Verify initial order line item snapshot
  console.log(`[ORDER CREATED] Order ID: ${order.id}, Snapshot Line Item: ₹${order.items[0].lineItemTotal}, Base Unit Price Snapshot: ₹${order.items[0].basePriceAtOrderTime}`);

  // 2. Pay and verify
  PaymentService.verifyPayment({
    orderId: order.id,
    intentId: 'intent_pers_01',
    gatewayPaymentId: 'pay_pers_001',
    gatewayOrderId: 'order_pers_001',
    gatewaySignature: 'sig_test_valid',
  });

  const remainingStockBeforeRestart = db.getProductById(sugarProduct.id)!.currentStockInBaseUnits;
  console.log(`[AFTER PAYMENT] Stock deducted to: ${remainingStockBeforeRestart} kg (Expected: 99.5 kg)`);

  // 3. Mutate product price in catalogue (e.g. inflation / seller price increase from ₹100 -> ₹140)
  sugarProduct.fractionalConfig.basePrice = 140.0;
  db.saveProduct(sugarProduct);
  console.log(`[PRICE UPDATED IN CATALOGUE] New base price: ₹${sugarProduct.fractionalConfig.basePrice}/kg`);

  // 4. Simulate complete Server Shutdown and Reload from disk
  console.log('\n[SIMULATING SERVER REBOOT & DISK RELOAD]...');
  const diskFilePath = path.join(process.cwd(), 'data', 'marketplace_db.json');
  const fileExists = fs.existsSync(diskFilePath);
  console.log(`- Checking disk persistence file at ${diskFilePath}: Exists = ${fileExists}`);

  if (!fileExists) {
    throw new Error('Database persistence file was not created on disk!');
  }

  // Reload database instance fresh from file
  const rawDiskData = fs.readFileSync(diskFilePath, 'utf8');
  const parsedState = JSON.parse(rawDiskData);

  const reloadedOrder = parsedState.orders.find((o: any) => o.id === order.id);
  const reloadedSugar = parsedState.products.find((p: any) => p.id === sugarProduct.id);

  const orderSurvives = !!reloadedOrder && reloadedOrder.status === OrderStatus.CONFIRMED;
  const stockSurvives = reloadedSugar && reloadedSugar.currentStockInBaseUnits === 99.5;
  const priceSnapshotUnchanged = reloadedOrder && reloadedOrder.items[0].lineItemTotal === 50.0 && reloadedOrder.items[0].basePriceAtOrderTime === 100.0;

  console.log('\n====================================================');
  console.log('                 PERSISTENCE AUDIT                  ');
  console.log('====================================================');
  console.log(`1. Order survived restart: ${orderSurvives ? 'YES (PASS)' : 'NO (FAIL)'}`);
  console.log(`2. Stock deduction survived restart: ${stockSurvives ? 'YES (PASS)' : 'NO (FAIL)'} (${reloadedSugar?.currentStockInBaseUnits} kg)`);
  console.log(`3. Order price snapshot preserved (Historical integrity): ${priceSnapshotUnchanged ? 'YES (PASS)' : 'NO (FAIL)'} (Order: ₹${reloadedOrder?.items[0].lineItemTotal}, Base: ₹${reloadedOrder?.items[0].basePriceAtOrderTime})`);

  if (orderSurvives && stockSurvives && priceSnapshotUnchanged) {
    console.log('\n[TEST RESULT] ALL PERSISTENCE INVARIANTS VERIFIED SUCCESSFULLY (100% PASS)');
  } else {
    console.error('\n[TEST RESULT] PERSISTENCE INVARIANT FAILED');
    process.exit(1);
  }
}

testPersistence();
