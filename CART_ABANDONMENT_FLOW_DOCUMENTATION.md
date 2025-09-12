# Complete Cart Abandonment System Flow Documentation

## Overview

This document describes the complete flow of the cart abandonment and call queue system, including all decision points, conditions, and data transformations.

---

## Phase 1: Cart Creation & Updates (Webhook Processing)

### 1.1 Checkout Create Webhook

```
Webhook: checkouts/create
↓
1. Verify Shopify webhook signature
2. Parse checkout data from request body
3. Find shop by domain in ShopifyShop collection
4. Check if cart already exists by shopifyCheckoutId:
   ├─ EXISTS → Update existing cart + reset lastActivityAt
   └─ NOT EXISTS → Create new cart with:
      ├─ status: "inCheckout"
      ├─ addedToAbandonedCart: false
      ├─ abandonedCartId: null
      ├─ lastActivityAt: current time
      └─ All cart data from Shopify checkout
```

### 1.2 Checkout Update Webhook

```
Webhook: checkouts/update
↓
1. Verify Shopify webhook signature
2. Parse checkout data from request body
3. Find shop by domain in ShopifyShop collection
4. Find existing cart by shopifyCheckoutId
5. Update cart data + reset lastActivityAt + ensure status: "inCheckout"
   └─ This resets the abandonment timer
```

### 1.3 Order Create Webhook

```
Webhook: orders/create
↓
1. Verify Shopify webhook signature
2. Find cart by checkout_id from order data
3. Mark cart as purchased:
   ├─ status: "purchased"
   ├─ completedAt: current time
   └─ lastActivityAt: current time
   └─ This removes cart from abandonment processing
```

---

## Phase 2: Cart Scanner (Every 10 seconds)

### 2.1 Scanner Initialization

```
CartScannerQueue.initialize()
↓
1. Connect to MongoDB
2. Register cron job with QueueService
3. Set schedule: "*/10 * * * * *" (every 10 seconds)
4. Start job with 2-second delay
5. Log initialization success
```

### 2.2 Main Scanner Loop

```
scanAbandonedCarts(correlationId)
↓
1. Check if already running (prevent overlap)
   ├─ IF running → Skip this cycle
   └─ ELSE → Continue

2. Connect to database

3. Calculate timeout threshold:
   ├─ timeoutAgo = now - ABANDONED_CART_CHECK_DELAY (1 minute)
   └─ This is the cutoff time for abandonment

4. Query for abandoned carts:
   ├─ status: "inCheckout"
   └─ lastActivityAt < timeoutAgo

5. Process each abandoned cart found:
   ├─ Log total carts in checkout
   ├─ Log found abandoned carts count
   └─ For each cart → processAbandonedCart()
```

### 2.3 Process Each Abandoned Cart

```
processAbandonedCart(cart, parentCorrelationId)
↓
1. Generate correlation ID for tracking

2. Find active agent for user:
   ├─ userId: cart.userId
   ├─ type: "abandoned-cart"
   └─ status: "active"

   IF NO AGENT FOUND:
   ├─ Log error with correlation ID
   ├─ Skip processing
   └─ Return (cart not processed)

3. Find shop by userId
   ├─ IF shop not found → Throw error (critical)

4. Calculate nextCallTime:
   ├─ Get agent.callLogic.callSchedule.waitTime (e.g., 30)
   ├─ Get agent.callLogic.callSchedule.waitTimeUnit (e.g., "minutes")
   └─ Calculate: nextCallTime = now + waitTime
      ├─ minutes: add to minutes
      ├─ hours: add to hours
      ├─ days: add to days
      └─ default: 30 minutes

5. Check cart.addedToAbandonedCart flag:
   ├─ FALSE → Scenario A: New Abandoned Cart
   └─ TRUE → Scenario B: Existing Abandoned Cart
```

---

## Phase 3A: New Abandoned Cart (Scenario A)

### 3A.1 Create New Abandoned Cart

```
handleNewAbandonedCart(cart, agent, shop, nextCallTime, correlationId)
↓
1. Create AbandonedCart record:
   ├─ cartId: cart._id (reference to Cart)
   ├─ userId: cart.userId
   ├─ shopifyCheckoutId: cart.shopifyCheckoutId
   ├─ abandonedAt: current timestamp
   ├─ nextCallTime: calculated time
   ├─ orderStage: "abandoned" (default)
   ├─ orderQueueStatus: "Pending" (default)
   ├─ orderQueueState: "New" (default)
   ├─ isQualified: false (will be checked later)
   ├─ isEligibleForQueue: true (default)
   ├─ nextAttemptShouldBeMade: true (default)
   ├─ totalAttempts: 0 (default)
   ├─ isDNP: false (default)
   └─ correlationId: generated

2. Update Cart record:
   ├─ status: "abandoned"
   ├─ addedToAbandonedCart: true
   ├─ abandonedCartId: new AbandonedCart._id
   └─ lastActivityAt: current time

3. Add to CallQueue:
   ├─ abandonedCartId: AbandonedCart._id
   ├─ userId: cart.userId
   ├─ agentId: agent._id
   ├─ shopId: shop._id
   ├─ cartId: cart._id
   ├─ nextAttemptTime: nextCallTime
   ├─ status: "pending"
   ├─ attemptNumber: 1
   └─ correlationId: generated

4. Log success with next call time
```

---

## Phase 3B: Existing Abandoned Cart (Scenario B)

### 3B.1 Update Existing Abandoned Cart

```
handleExistingAbandonedCart(cart, agent, shop, nextCallTime, correlationId)
↓
1. Find existing AbandonedCart by cart.abandonedCartId

   IF NOT FOUND:
   ├─ Log warning
   ├─ Call handleNewAbandonedCart() (fallback)
   └─ Return

2. Clean up old queue entries:
   ├─ Delete CallQueue entries where:
   │  ├─ abandonedCartId: existingAbandonedCart._id
   │  └─ status: "pending"
   └─ This prevents duplicate calls

3. Update AbandonedCart:
   ├─ abandonedAt: current time (latest abandonment)
   ├─ nextCallTime: calculated time
   ├─ isEligibleForQueue: true (re-activate)
   ├─ orderQueueStatus: "Pending"
   ├─ orderQueueState: "New"
   └─ correlationId: new

4. Update Cart:
   ├─ status: "abandoned"
   └─ lastActivityAt: current time

5. Add to CallQueue (same as Scenario A)

6. Log success with next call time
```

---

## Phase 4: Call Queue Processing (Future Implementation)

### 4.1 Queue Processor

```
CallProcessorQueue.processQueue()
↓
1. Find pending calls ready to be made:
   ├─ status: "pending"
   └─ nextAttemptTime <= current time

2. For each call:
   ├─ Check business hours:
   │  ├─ Get agent.callLogic.callSchedule.callTimeStart
   │  ├─ Get agent.callLogic.callSchedule.callTimeEnd
   │  └─ Check if current time is within business hours

   ├─ Check weekend calling:
   │  ├─ Get agent.callLogic.callSchedule.weekendCalling
   │  └─ IF false AND weekend → Skip call

   ├─ Check DND respect:
   │  ├─ Get agent.callLogic.callSchedule.respectDND
   │  └─ IF true → Check customer DND status

   └─ IF ELIGIBLE:
      ├─ Update CallQueue status: "processing"
      ├─ Make VAPI call with agent configuration
      ├─ Update call results
      └─ Schedule next attempt if needed
```

### 4.2 Qualification Check (During Queue Processing)

```
Check qualification criteria:
├─ Cart value check:
│  ├─ Get agent.callLogic.conditions (cart-value type)
│  ├─ Compare cart.totalPrice with threshold
│  └─ Set cartValueQualified: true/false
├─ Phone number check:
│  ├─ Check cart.customerPhone
│  ├─ Check cart.shippingAddress.phone
│  └─ Set phoneNumberAvailable: true/false
├─ Other conditions:
│  ├─ Customer type
│  ├─ Products in cart
│  ├─ Previous orders
│  ├─ Location
│  └─ Coupon codes
└─ Set overallQualified based on enabled conditions
```

---

## Phase 5: Call Results Processing (Future Implementation)

### 5.1 After Call Completion

```
Process call results from VAPI:
↓
1. Update AbandonedCart:
   ├─ totalAttempts: increment by 1
   ├─ lastAttemptTime: current time
   ├─ lastCallStatus: "picked"/"not_picked"/"call_in_progress"
   ├─ lastCallOutcome: call result description
   ├─ callHistory: add detailed call object
   └─ orderStage: update based on outcome
      ├─ "contacted" → if call connected
      ├─ "converted" → if order completed
      └─ "failed" → if call failed

2. Update CallQueue:
   ├─ status: "completed"/"failed"
   ├─ lastProcessedAt: current time
   └─ processingNotes: call details

3. Schedule next attempt:
   ├─ Get agent.callLogic.callSchedule.retryIntervals
   ├─ Find interval for current attempt number
   ├─ Calculate next attempt time
   ├─ IF maxRetries not reached:
   │  ├─ Create new CallQueue entry
   │  ├─ Set nextAttemptTime
   │  └─ Increment attemptNumber
   └─ ELSE:
      ├─ Mark as completed/failed
      ├─ Set isDNP: true
      └─ Set nextAttemptShouldBeMade: false
```

---

## Key Decision Points & Conditions

### 1. Agent Requirements

- ✅ **Must have active agent** with:
  - `type: "abandoned-cart"`
  - `status: "active"`
- ❌ **No agent = skip processing** (logged as error with correlation ID)

### 2. Cart Status Logic

- ✅ **Only process carts** with `status: "inCheckout"`
- ✅ **Mark as abandoned** when time threshold exceeded
- ✅ **Skip if already abandoned** (prevents reprocessing)
- ✅ **Skip if purchased** (order completed)

### 3. Time Calculations

- ✅ **Abandonment threshold**: 1 minute (configurable via `ABANDONED_CART_CHECK_DELAY`)
- ✅ **Next call time**: Based on agent's `waitTime` and `waitTimeUnit`
- ✅ **Supports units**: minutes, hours, days
- ✅ **Default fallback**: 30 minutes if unit not recognized

### 4. Scenario Detection

- ✅ **New cart**: `addedToAbandonedCart: false`
- ✅ **Updated cart**: `addedToAbandonedCart: true`
- ✅ **Fallback**: If abandoned cart record missing, create new one

### 5. Queue Management

- ✅ **Cleanup**: Remove old pending entries before adding new ones
- ✅ **Re-activation**: Set `isEligibleForQueue: true` for updates
- ✅ **No duplicates**: Unique constraints prevent duplicate processing
- ✅ **Status tracking**: Proper status transitions

### 6. Error Handling

- ✅ **Database errors**: Logged with correlation IDs for tracing
- ✅ **Missing data**: Graceful fallbacks where possible
- ✅ **Agent missing**: Skip with error log (non-critical)
- ✅ **Shop missing**: Throw error (critical - system failure)

### 7. Data Integrity

- ✅ **Atomic operations**: Cart and AbandonedCart updated together
- ✅ **Correlation IDs**: End-to-end tracing for debugging
- ✅ **Unique constraints**: Prevent duplicate records
- ✅ **Referential integrity**: Proper foreign key relationships

---

## Database Schema Relationships

### Cart Collection

```
Cart {
  _id: ObjectId
  shopifyCheckoutId: String (unique)
  userId: ObjectId → User
  status: "inCheckout" | "abandoned" | "purchased" | "expired"
  addedToAbandonedCart: Boolean
  abandonedCartId: ObjectId → AbandonedCart
  lastActivityAt: Date
  // ... other cart fields
}
```

### AbandonedCart Collection

```
AbandonedCart {
  _id: ObjectId
  cartId: ObjectId → Cart (unique)
  userId: ObjectId → User
  agentId: ObjectId → Agent
  shopifyCheckoutId: String
  abandonedAt: Date
  nextCallTime: Date
  orderStage: "abandoned" | "contacted" | "converted" | "failed"
  totalAttempts: Number
  lastAttemptTime: Date
  lastCallStatus: "picked" | "not_picked" | "call_in_progress" | null
  callHistory: [Mixed] // Array of call objects
  isQualified: Boolean
  isEligibleForQueue: Boolean
  // ... other fields
}
```

### CallQueue Collection

```
CallQueue {
  _id: ObjectId
  abandonedCartId: ObjectId → AbandonedCart
  userId: ObjectId → User
  agentId: ObjectId → Agent
  shopId: ObjectId → ShopifyShop
  cartId: ObjectId → Cart
  nextAttemptTime: Date
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"
  attemptNumber: Number
  // ... other fields
}
```

---

## Configuration Examples

### Agent Configuration

```javascript
{
  type: "abandoned-cart",
  status: "active",
  callLogic: {
    callSchedule: {
      waitTime: "30",
      waitTimeUnit: "minutes",
      maxRetries: 3,
      retryIntervals: [
        { attempt: 1, delay: 30, delayUnit: "minutes" },
        { attempt: 2, delay: 5, delayUnit: "minutes" },
        { attempt: 3, delay: 3, delayUnit: "hours" }
      ],
      weekendCalling: false,
      callTimeStart: "09:00",
      callTimeEnd: "18:00",
      timezone: "America/Chicago"
    },
    conditions: [
      { type: "cart-value", operator: ">=", value: "50", enabled: true }
    ]
  }
}
```

---

## Logging Examples

### Successful Flow

```
🛒 [09/11 10:30:15] Initializing Cart Scanner Queue...
✅ MongoDB connected for Cart Scanner Queue
✅ [09/11 10:30:16] Cart Scanner Queue initialized successfully
🔍 [2025-09-11 10:30:16 (UTC+5:30)] Cart scanner running...
⏰ Looking for carts abandoned before: 2025-09-11 10:29:16 (UTC+5:30)
📊 Total carts in checkout: 5
🛒 Found 2 carts ready for abandonment processing
🛒 Processing abandoned cart: 37190767378691
✅ Created new abandoned cart: 68c15d5ab05187ded43cc6bc (next call: 09/11 11:00:16)
📞 Added to call queue: 68c15d5ab05187ded43cc6bd (scheduled for: 2025-09-11 11:00:16 (UTC+5:30))
✅ Cart scan completed. Successfully processed 2/2 carts
```

### Error Scenarios

```
⚠️ No active abandoned cart agent found for user 68c0f27778c48da9a841e2b8. Skipping processing.
❌ Failed to process cart 68c130f0816549f87695ed55: No active abandoned cart agent found
⚠️ Abandoned cart record not found: 68c15d5ab05187ded43cc6bc. Creating new one.
```

---

## Summary

This system provides a robust, scalable cart abandonment solution that:

1. **Tracks all cart activity** through Shopify webhooks
2. **Detects abandonment** based on configurable time thresholds
3. **Manages call scheduling** using agent-specific configurations
4. **Handles both new and updated carts** seamlessly
5. **Prevents duplicate processing** through proper state management
6. **Provides comprehensive logging** for debugging and monitoring
7. **Maintains data integrity** through atomic operations and constraints

The system is designed to be fault-tolerant, with graceful error handling and fallback mechanisms to ensure reliable operation in production environments.
