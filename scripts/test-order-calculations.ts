import { PricingEngine } from '../src/core/pricingEngine.ts';
import { FulfillmentType } from '../src/types/order.ts';
import { ShoppingRequestService } from '../src/server/services/shoppingRequest.service.ts';
import { db } from '../src/server/storage/db.ts';
import { User, UserRole } from '../src/types/auth.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('--- RUNNING ORDER & BILL CALCULATION TESTS ---');

// TEST 1: Multiple items with different quantities and prices.
// Verify every lineTotal and subtotal manually.
const testItems1 = [
  { unitPrice: 44, quantityMultiplier: 0.5, quantityCount: 1, isAvailable: true }, // Sugar 500g -> ₹22
  { unitPrice: 5, quantityMultiplier: 1.0, quantityCount: 2, isAvailable: true },  // Biscuit 2 pkts -> ₹10
  { unitPrice: 28, quantityMultiplier: 1.0, quantityCount: 1, isAvailable: true }, // Salt 1kg -> ₹28
  { unitPrice: 145, quantityMultiplier: 1.0, quantityCount: 1, isAvailable: true },// Mustard oil 1L -> ₹145
  { unitPrice: 50, isMoneyOrder: true, moneyAmount: 50, isAvailable: true },         // Budget item -> ₹50
  { unitPrice: 10, quantityMultiplier: 1.0, quantityCount: 10, isAvailable: true },// Soap 10 pkts -> ₹100
];

const lineTotals = testItems1.map(i => PricingEngine.calculateLineTotal(i));
assert(lineTotals[0] === 22, 'Item 0 (500g at ₹44/kg) lineTotal is 22');
assert(lineTotals[1] === 10, 'Item 1 (2 pkts at ₹5) lineTotal is 10');
assert(lineTotals[2] === 28, 'Item 2 (1 pkt at ₹28) lineTotal is 28');
assert(lineTotals[3] === 145, 'Item 3 (1 bottle at ₹145) lineTotal is 145');
assert(lineTotals[4] === 50, 'Item 4 (₹50 budget item) lineTotal is 50');
assert(lineTotals[5] === 100, 'Item 5 (10 pkts at ₹10) lineTotal is 100');

const expectedSubtotal = 22 + 10 + 28 + 145 + 50 + 100; // 355
const bill1 = PricingEngine.calculateBill(testItems1, { fulfillmentType: FulfillmentType.STORE_PICKUP });
assert(bill1.itemSubtotal === expectedSubtotal, `Subtotal equals exact manual sum (${expectedSubtotal})`);

// TEST 2: Add item -> subtotal immediately increases by exact lineTotal
const newItem = { unitPrice: 35, quantityMultiplier: 1.0, quantityCount: 1, isAvailable: true };
const itemsAfterAdd = [...testItems1, newItem];
const billAfterAdd = PricingEngine.calculateBill(itemsAfterAdd, { fulfillmentType: FulfillmentType.STORE_PICKUP });
assert(
  billAfterAdd.itemSubtotal === bill1.itemSubtotal + 35,
  'Add item: subtotal immediately increases by exact lineTotal (+₹35)'
);

// TEST 3: Remove item -> subtotal immediately decreases by exactly that item's current lineTotal
const itemsAfterRemove = testItems1.slice(1); // removed item 0 (₹22)
const billAfterRemove = PricingEngine.calculateBill(itemsAfterRemove, { fulfillmentType: FulfillmentType.STORE_PICKUP });
assert(
  billAfterRemove.itemSubtotal === bill1.itemSubtotal - 22,
  'Remove item: subtotal immediately decreases by exactly removed lineTotal (-₹22)'
);

// TEST 4: Change quantity -> subtotal immediately recalculates from scratch
const itemsAfterQtyChange = testItems1.map((item, idx) =>
  idx === 1 ? { ...item, quantityCount: 4 } : item // 4 pkts instead of 2 pkts -> 4 * 5 = 20 (+10)
);
const billAfterQtyChange = PricingEngine.calculateBill(itemsAfterQtyChange, { fulfillmentType: FulfillmentType.STORE_PICKUP });
assert(
  billAfterQtyChange.itemSubtotal === expectedSubtotal + 10,
  'Change quantity: subtotal immediately recalculates from scratch'
);

// TEST 5: Pickup order -> delivery charge follows existing pickup configuration (₹0)
const billPickup = PricingEngine.calculateBill(testItems1, {
  fulfillmentType: FulfillmentType.STORE_PICKUP,
  deliveryFee: 25, // shop might have 25 configured, but pickup must be 0
});
assert(billPickup.deliveryFee === 0, 'Pickup order delivery fee is strictly ₹0');
assert(billPickup.customerTotal === billPickup.itemSubtotal, 'Pickup order total has no delivery charge');

// TEST 6: Home Delivery order -> delivery charge follows existing delivery configuration exactly once
const billDelivery = PricingEngine.calculateBill(testItems1, {
  fulfillmentType: FulfillmentType.HOME_DELIVERY,
  deliveryFee: 25,
});
assert(billDelivery.deliveryFee === 25, 'Home Delivery fee applied exactly once');
assert(billDelivery.customerTotal === billDelivery.itemSubtotal + 25, 'Home Delivery total = subtotal + 25');

// TEST 7: Seller gives ₹50 discount -> Final = Subtotal - ₹50 + applicable fees
const billDiscount = PricingEngine.calculateBill(testItems1, {
  fulfillmentType: FulfillmentType.HOME_DELIVERY,
  deliveryFee: 20,
  discount: 50,
  platformFee: 0,
});
assert(billDiscount.discount === 50, 'Discount is ₹50');
assert(
  billDiscount.customerTotal === billDiscount.itemSubtotal - 50 + 20,
  `Final bill with ₹50 discount is Subtotal (${billDiscount.itemSubtotal}) - 50 + 20 = ${billDiscount.customerTotal}`
);

// TEST 8: Seller gives no discount -> Discount = ₹0 and final amount remains correct
const billNoDiscount = PricingEngine.calculateBill(testItems1, {
  fulfillmentType: FulfillmentType.HOME_DELIVERY,
  deliveryFee: 20,
  discount: 0,
  platformFee: 0,
});
assert(billNoDiscount.discount === 0, 'Discount is ₹0 when none given');
assert(
  billNoDiscount.customerTotal === billNoDiscount.itemSubtotal + 20,
  `Final bill without discount is Subtotal (${billNoDiscount.itemSubtotal}) + 20 = ${billNoDiscount.customerTotal}`
);

// TEST 9: Seller finalizes bill. Customer must see exactly the same finalized total.
const sellerAuth = {
  userId: 'usr_seller_krishna',
  role: UserRole.SELLER,
  shopId: 'shp_krishna_grocers',
};

const reqs = db.getShoppingRequests();
assert(reqs.length > 0, 'Seed shopping requests exist');
const testReq = reqs.find(r => r.id === 'req_voice_001') || reqs.find(r => r.items.length === 10) || reqs[0];

// Test with Home Delivery and ₹46 discount
testReq.fulfillmentType = FulfillmentType.HOME_DELIVERY;
testReq.status = 'PENDING_SELLER_REVIEW' as any;

const finalizeResult = ShoppingRequestService.finalizeBill(testReq.id, sellerAuth, {
  deliveryFee: 20,
  discount: 46, // ₹46 discount on ₹546 subtotal -> ₹500 merchandise + ₹20 delivery = ₹520
  sellerNotes: 'Packing ready soon',
  items: testReq.items.map(i => ({
    id: i.id,
    productId: i.matchedProductId,
    productName: i.matchedProductName || i.rawItemName,
    productImage: i.matchedProductImage,
    unitPrice: i.unitPrice || 20,
    quantityCount: i.quantityCount,
    quantityMultiplier: i.quantityMultiplier,
    unitDisplay: i.unitDisplay,
    baseUnit: i.baseUnit,
    isAvailable: true,
  })),
});

assert(finalizeResult.finalBill !== undefined, 'Final bill is saved on request');
assert(finalizeResult.finalBill?.itemSubtotal === 546, `Seller finalized subtotal is ₹546 (got ₹${finalizeResult.finalBill?.itemSubtotal})`);
assert(finalizeResult.finalBill?.discount === 46, `Seller finalized discount is ₹46 (got ₹${finalizeResult.finalBill?.discount})`);
assert(finalizeResult.finalBill?.deliveryFee === 20, `Seller finalized deliveryFee is ₹20 (got ₹${finalizeResult.finalBill?.deliveryFee})`);
assert(finalizeResult.finalBill?.customerTotal === 520, `Final bill to customer is 546 - 46 + 20 = 520 (got ₹${finalizeResult.finalBill?.customerTotal})`);

// TEST 10: Refresh/reload Customer App and Seller App. The final total must remain exactly the same.
const reloadedReq = db.getShoppingRequestById(testReq.id);
assert(reloadedReq?.finalBill?.customerTotal === 520, 'Reloaded request preserves identical final total (₹520)');
assert(reloadedReq?.finalBill?.itemSubtotal === 546, 'Reloaded request preserves identical subtotal (₹546)');
assert(reloadedReq?.finalBill?.discount === 46, 'Reloaded request preserves identical discount (₹46)');

// TEST 11: Create an order containing enough items that the subtotal is >₹500.
// Verify the displayed subtotal and final bill equal the exact mathematical sum of every line item.
// All 10 items in seed data: 10 + 10 + 22 + 10 + 28 + 145 + 38 + 28 + 35 + 220 = 546
const calculated10ItemsBill = PricingEngine.calculateBill(testReq.items, {
  fulfillmentType: FulfillmentType.HOME_DELIVERY,
  deliveryFee: 20,
  discount: 0,
});
const sumOfAll10LineItems = testReq.items.reduce((s, it) => s + PricingEngine.calculateLineTotal(it), 0);
assert(sumOfAll10LineItems > 500, `Sum of line items is > ₹500 (${sumOfAll10LineItems})`);
assert(calculated10ItemsBill.itemSubtotal === sumOfAll10LineItems, 'Subtotal exactly matches sum of all line items');
assert(calculated10ItemsBill.customerTotal === sumOfAll10LineItems + 20, 'Final bill equals subtotal + delivery');

// TEST 12: Verify no item is counted twice and no item is omitted.
assert(testReq.items.length === 10, 'All 10 items are present');
assert(calculated10ItemsBill.itemSubtotal === 546, 'Exact subtotal for all 10 items is ₹546 with no duplication or omission');

// TEST 13: Customer pays and converts to Order. Order financials match finalized bill exactly.
const customerUser: User = db.getUserById(testReq.customerId) || {
  id: testReq.customerId,
  phone: testReq.customerPhone,
  role: UserRole.CUSTOMER,
  fullName: testReq.customerName,
  addresses: [],
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const convertResult = ShoppingRequestService.payAndConvertToOrder(testReq.id, customerUser, {
  method: 'UPI',
  transactionRef: 'tx_test_123',
});
assert(convertResult.order.financials.itemSubtotal === 546, 'Converted order subtotal matches finalized bill (₹546)');
assert(convertResult.order.financials.discount === 46, 'Converted order discount matches finalized bill (₹46)');
assert(convertResult.order.financials.deliveryFee === 20, 'Converted order delivery fee matches finalized bill (₹20)');
assert(convertResult.order.financials.customerTotal === 520, 'Converted order customer total matches finalized bill (₹520)');
assert(
  convertResult.order.financials.customerTotal ===
    convertResult.order.financials.itemSubtotal - convertResult.order.financials.discount + convertResult.order.financials.deliveryFee,
  'Mathematical equality holds: customerTotal = subtotal - discount + deliveryFee'
);

console.log('\n🎉 ALL 13 BILLING & ORDER CALCULATION TESTS PASSED SUCCESSFULLY!');
