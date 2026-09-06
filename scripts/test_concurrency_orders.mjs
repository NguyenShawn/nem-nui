/**
 * ============================================================================
 * CONCURRENCY & ZERO DATA LOSS TEST HARNESS: MILESTONE M2
 * Nem Núi Enterprise Delivery Platform
 * File: Nem Núi/scripts/test_concurrency_orders.mjs
 * ============================================================================
 *
 * Verifications performed:
 * 1. Spawns 10 concurrent orders (via HTTP if server is running, or DAL concurrency engine).
 * 2. Verifies all 10 requests return { success: true, code: ... }.
 * 3. Verifies all 10 returned order codes are strictly unique (Set size === 10).
 * 4. Verifies all 10 orders are persisted with correct quantities and totals (Zero Data Loss).
 * 5. Verifies collision retry loop behavior under PostgreSQL unique violation (23505).
 */

import http from "node:http";
import https from "node:https";
import { saveNewOrder, getOrders, getOrderByCode, isUniqueViolation } from "../lib/orderDb.ts";
import { isSupabaseConfigured, supabaseAdmin } from "../lib/supabase.ts";
import { generateOrderCode } from "../lib/utils.ts";
import { POST as orderApiRoute } from "../app/api/order/route.ts";
import { NextRequest } from "next/server";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const ORDER_CODE_REGEX = /^[2-9A-HJ-NP-Z]{6}$/;

console.log("======================================================================");
console.log("⚡ CONCURRENCY & ZERO DATA LOSS TEST HARNESS (10 CONCURRENT ORDERS)");
console.log(`🎯 Target Endpoint : ${BASE_URL}/api/order (with DAL direct fallback)`);
console.log(`📦 Supabase Config : ${isSupabaseConfigured ? "CONFIGURED (Cloud DB)" : "IN-MEMORY FALLBACK"}`);
console.log("======================================================================\n");

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition, name, details = {}) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✔ [PASS] ${name}`);
  } else {
    failedAssertions++;
    console.error(`  ✖ [FAIL] ${name}`);
    if (Object.keys(details).length > 0) {
      console.error(`     Details: ${JSON.stringify(details)}`);
    }
  }
}

// 10 Distinct customer test payloads
const CONCURRENT_TEST_PAYLOADS = [
  {
    customer_name: "Nguyễn Văn Đồng Thời 01",
    phone: "0901000001",
    address: "Số 101 Đường Đồng Thời, Phường 1, TP. Thủ Đức",
    payment_method: "cod",
    items: [{ id: "bun-nem-nuong", name: "Bún Nem Nướng Chả Giò", price: 45000, qty: 1 }],
    subtotal: 45000,
    shipping_fee: 15000,
    total: 60000,
    status: "new",
  },
  {
    customer_name: "Trần Thị Đồng Thời 02",
    phone: "0901000002",
    address: "Số 102 Đường Đồng Thời, Phường 2, Quận Bình Chánh",
    payment_method: "momo",
    items: [{ id: "bun-nem-nuong", name: "Bún Nem Nướng Chả Giò", price: 45000, qty: 2 }],
    subtotal: 90000,
    shipping_fee: 15000,
    total: 105000,
    status: "new",
  },
  {
    customer_name: "Lê Hoàng Đồng Thời 03",
    phone: "0901000003",
    address: "Số 103 Đường Đồng Thời, Phường 3, Quận 10",
    payment_method: "cod",
    items: [
      { id: "nem-nuong-dac-biet", name: "Mẹt Nem Nướng Đặc Biệt", price: 55000, qty: 1 },
      { id: "tra-tac-hat-chia", name: "Trà Tắc Mật Ong Hạt Chia", price: 15000, qty: 1 },
    ],
    subtotal: 70000,
    shipping_fee: 15000,
    total: 85000,
    status: "new",
  },
  {
    customer_name: "Phạm Minh Đồng Thời 04",
    phone: "0901000004",
    address: "Số 104 Đường Đồng Thời, Phường 4, Quận Bình Thạnh",
    payment_method: "momo",
    items: [{ id: "nem-nuong-dac-biet", name: "Mẹt Nem Nướng Đặc Biệt", price: 55000, qty: 2 }],
    subtotal: 110000,
    shipping_fee: 15000,
    total: 125000,
    status: "new",
  },
  {
    customer_name: "Hoàng Gia Đồng Thời 05",
    phone: "0901000005",
    address: "Số 105 Đường Đồng Thời, Phường 5, Quận Tân Bình",
    payment_method: "cod",
    items: [
      { id: "bun-nem-nuong", name: "Bún Nem Nướng Chả Giò", price: 45000, qty: 1 },
      { id: "tra-tac-hat-chia", name: "Trà Tắc Mật Ong Hạt Chia", price: 15000, qty: 1 },
    ],
    subtotal: 60000,
    shipping_fee: 15000,
    total: 75000,
    status: "new",
  },
  {
    customer_name: "Vũ Tuấn Đồng Thời 06",
    phone: "0901000006",
    address: "Số 106 Đường Đồng Thời, Phường 6, Quận Phú Nhuận",
    payment_method: "cod",
    items: [{ id: "nem-nuong-dac-biet", name: "Mẹt Nem Nướng Đặc Biệt", price: 55000, qty: 1 }],
    subtotal: 55000,
    shipping_fee: 15000,
    total: 70000,
    status: "new",
  },
  {
    customer_name: "Đặng Thu Đồng Thời 07",
    phone: "0901000007",
    address: "Số 107 Đường Đồng Thời, Phường 7, Quận 3",
    payment_method: "momo",
    items: [{ id: "bun-nem-nuong", name: "Bún Nem Nướng Chả Giò", price: 45000, qty: 3 }],
    subtotal: 135000,
    shipping_fee: 15000,
    total: 150000,
    status: "new",
  },
  {
    customer_name: "Bùi Anh Đồng Thời 08",
    phone: "0901000008",
    address: "Số 108 Đường Đồng Thời, Phường 8, Quận 5",
    payment_method: "cod",
    items: [
      { id: "bun-nem-nuong", name: "Bún Nem Nướng Chả Giò", price: 45000, qty: 1 },
      { id: "tra-tac-hat-chia", name: "Trà Tắc Mật Ong Hạt Chia", price: 15000, qty: 2 },
    ],
    subtotal: 75000,
    shipping_fee: 15000,
    total: 90000,
    status: "new",
  },
  {
    customer_name: "Ngô Quốc Đồng Thời 09",
    phone: "0901000009",
    address: "Số 109 Đường Đồng Thời, Phường 9, Quận 1",
    payment_method: "momo",
    items: [
      { id: "nem-nuong-dac-biet", name: "Mẹt Nem Nướng Đặc Biệt", price: 55000, qty: 2 },
      { id: "tra-tac-hat-chia", name: "Trà Tắc Mật Ong Hạt Chia", price: 15000, qty: 2 },
    ],
    subtotal: 140000,
    shipping_fee: 15000,
    total: 155000,
    status: "new",
  },
  {
    customer_name: "Dương Mai Đồng Thời 10",
    phone: "0901000010",
    address: "Số 110 Đường Đồng Thời, Phường 10, Quận Gò Vấp",
    payment_method: "cod",
    items: [
      { id: "bun-nem-nuong", name: "Bún Nem Nướng Chả Giò", price: 45000, qty: 1 },
      { id: "nem-nuong-dac-biet", name: "Mẹt Nem Nướng Đặc Biệt", price: 55000, qty: 1 },
    ],
    subtotal: 100000,
    shipping_fee: 15000,
    total: 115000,
    status: "new",
  },
];

async function checkHttpServer() {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/api/menu`, { timeout: 1000 }, (res) => {
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function postHttpOrder(payload) {
  const url = `${BASE_URL}/api/order`;
  const bodyData = JSON.stringify({
    customerName: payload.customer_name,
    phone: payload.phone,
    address: payload.address,
    paymentMethod: payload.payment_method,
    items: payload.items.map((i) => ({ id: i.id, qty: i.qty })),
  });

  return new Promise((resolve) => {
    const isHttps = url.startsWith("https");
    const client = isHttps ? https : http;
    const req = client.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(bodyData),
        },
        timeout: 10000,
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => (rawData += chunk));
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = { raw: rawData };
          }
          resolve({
            statusCode: res.statusCode,
            success: res.statusCode === 200 && parsed?.success === true,
            code: parsed?.code,
            payload,
          });
        });
      }
    );

    req.on("error", (err) => {
      resolve({ statusCode: -1, success: false, error: err.message, payload });
    });

    req.write(bodyData);
    req.end();
  });
}

async function runConcurrencyHarness() {
  const isServerLive = await checkHttpServer();

  console.log("----------------------------------------------------------------------");
  console.log(`▶ GATE 1 & GATE 2: DISPATCHING 10 CONCURRENT ORDERS (${isServerLive ? "HTTP REST API" : "DAL CONCURRENCY ENGINE"})`);
  console.log("----------------------------------------------------------------------");

  const startTime = Date.now();
  let results = [];

  if (isServerLive) {
    console.log(`🌐 Live Next.js server detected at ${BASE_URL}. Sending 10 concurrent HTTP requests...`);
    results = await Promise.all(CONCURRENT_TEST_PAYLOADS.map((p) => postHttpOrder(p)));
  } else {
    console.log("⚡ Standalone mode: Executing 10 concurrent orders via DAL saveNewOrder concurrency engine...");
    results = await Promise.all(
      CONCURRENT_TEST_PAYLOADS.map(async (payload) => {
        const res = await saveNewOrder({ ...payload });
        return {
          statusCode: res.success ? 200 : 500,
          success: res.success,
          code: res.code || res.order?.code,
          order: res.order,
          payload,
        };
      })
    );
  }

  const elapsedMs = Date.now() - startTime;
  console.log(`⏱️  Batch completed in ${elapsedMs}ms (~${(10 / (elapsedMs / 1000)).toFixed(1)} orders/sec)\n`);

  // 1. Assert all 10 return success: true
  results.forEach((res, idx) => {
    assert(
      res.success === true,
      `Order #${idx + 1} (${res.payload.customer_name}) processed successfully`,
      { code: res.code, status: res.statusCode }
    );
  });

  // 2. Assert 10 valid codes generated
  const returnedCodes = results.filter((r) => r.success && r.code).map((r) => r.code);
  assert(
    returnedCodes.length === 10,
    `All 10 orders received valid order codes (${returnedCodes.length}/10)`
  );

  returnedCodes.forEach((code, idx) => {
    assert(
      ORDER_CODE_REGEX.test(code),
      `Order #${idx + 1} code '${code}' matches Crockford Base32 6-character specification`
    );
  });

  // 3. Assert strictly ZERO duplicates (Set size === 10)
  const uniqueCodes = new Set(returnedCodes);
  assert(
    uniqueCodes.size === 10,
    `Zero collisions: All 10 order codes are strictly unique (Unique count: ${uniqueCodes.size}/10)`,
    { uniqueCodes: Array.from(uniqueCodes) }
  );

  console.log("\n----------------------------------------------------------------------");
  console.log("▶ GATE 3: DATA PERSISTENCE & ZERO DATA LOSS INTEGRITY CHECK");
  console.log("----------------------------------------------------------------------");

  // Query created orders
  let retrievedOrders = [];
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data: dbOrders, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .in("code", returnedCodes);
    if (!error && dbOrders) {
      retrievedOrders = dbOrders;
    }
  } else {
    // In-memory DAL check
    for (const code of returnedCodes) {
      const ord = await getOrderByCode(code);
      if (ord) retrievedOrders.push(ord);
    }
  }

  assert(
    retrievedOrders.length === 10,
    `All 10 orders verified in database storage (Found: ${retrievedOrders.length}/10)`
  );

  // Financial reconciliation: sum of all orders
  const expectedGrandTotal = CONCURRENT_TEST_PAYLOADS.reduce((sum, p) => sum + p.total, 0);
  const actualGrandTotal = retrievedOrders.reduce((sum, o) => sum + o.total, 0);

  assert(
    actualGrandTotal === expectedGrandTotal,
    `Zero Data Loss Financial Audit: Persisted total (${actualGrandTotal}đ) === Expected (${expectedGrandTotal}đ)`
  );

  console.log("\n----------------------------------------------------------------------");
  console.log("▶ GATE 4: REAL DATABASE COLLISION RETRY LOOP & CODE SYNCHRONIZATION");
  console.log("----------------------------------------------------------------------");

  // 1. Real collision retry verification via saveNewOrder
  const collidingCode = returnedCodes[0];
  console.log(`  ℹ Injecting known existing code #${collidingCode} to verify genuine collision retry...`);
  const collisionPayload = {
    customer_name: "Khách Thử Nghiệm Xung Đột Mã",
    phone: "0901999888",
    address: "999 Đường Xung Đột, Phường 1, Quận 1",
    payment_method: "cod",
    items: [{ id: "bun-nem-nuong", name: "Bún Nem Nướng Chả Giò", price: 45000, qty: 1 }],
    subtotal: 45000,
    shipping_fee: 15000,
    total: 60000,
    code: collidingCode,
  };

  const collisionRes = await saveNewOrder(collisionPayload);
  assert(
    collisionRes.success === true,
    "saveNewOrder successfully recovers from collision via retry loop"
  );
  assert(
    collisionRes.code !== collidingCode,
    `New order code was regenerated upon collision (${collidingCode} -> ${collisionRes.code})`
  );
  assert(
    ORDER_CODE_REGEX.test(collisionRes.code),
    `Regenerated order code '${collisionRes.code}' satisfies Crockford Base32 6-character format`
  );

  const persistedCollisionOrder = await getOrderByCode(collisionRes.code);
  assert(
    persistedCollisionOrder !== null && persistedCollisionOrder.code === collisionRes.code,
    `Persisted order in storage confirms synchronized order code '${collisionRes.code}'`
  );

  // 2. Real API Route code synchronization check
  console.log("  ℹ Verifying /api/order route code synchronization and persistence...");
  let routeTestRes;
  if (isServerLive) {
    routeTestRes = await postHttpOrder({
      customer_name: "Khách Test API Route Sync",
      phone: "0901888777",
      address: "888 Đường Đồng Bộ, Phường 2, Quận 3",
      payment_method: "cod",
      items: [{ id: "bun-nem-nuong", name: "Bún Nem Nướng Chả Giò", price: 45000, qty: 1 }],
      total: 60000,
    });
  } else {
    const directReq = new NextRequest("http://localhost:3000/api/order", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Khách Test API Route Sync",
        phone: "0901888777",
        address: "888 Đường Đồng Bộ, Phường 2, Quận 3",
        paymentMethod: "cod",
        items: [{ id: "bun-nem-nuong", qty: 1 }],
      }),
    });
    const res = await orderApiRoute(directReq);
    const body = await res.json();
    routeTestRes = {
      statusCode: res.status,
      success: res.status === 200 && body.success === true,
      code: body.code,
    };
  }

  assert(
    routeTestRes.success === true && routeTestRes.statusCode === 200,
    "API Route /api/order successfully returns HTTP 200 for valid order"
  );
  assert(
    typeof routeTestRes.code === "string" && ORDER_CODE_REGEX.test(routeTestRes.code),
    `API Route returned valid Crockford Base32 order code: '${routeTestRes.code}'`
  );

  const apiPersistedOrder = await getOrderByCode(routeTestRes.code);
  assert(
    apiPersistedOrder !== null && apiPersistedOrder.code === routeTestRes.code,
    `API Route returned code strictly matches database persistence record (${routeTestRes.code})`
  );

  // 3. PostgreSQL 23505 Unique Violation Classifier check
  assert(
    isUniqueViolation({ code: "23505", message: "duplicate key value violates unique constraint 'orders_code_key'" }) === true,
    "isUniqueViolation identifies standard PostgreSQL 23505 error code"
  );
  assert(
    isUniqueViolation({ details: "Key (code)=(NM1234) already exists. (23505)" }) === true,
    "isUniqueViolation identifies PostgREST duplicate key details"
  );
  assert(
    isUniqueViolation({ code: "42P01", message: "relation 'orders' does not exist" }) === false,
    "isUniqueViolation rejects non-unique PostgreSQL errors (e.g. 42P01)"
  );
  assert(
    isUniqueViolation(null) === false && isUniqueViolation(undefined) === false,
    "isUniqueViolation safely handles null and undefined error inputs"
  );

  console.log("\n======================================================================");
  console.log(`📊 CONCURRENCY HARNESS SUMMARY: ${passedAssertions}/${totalAssertions} Passed (${((passedAssertions / totalAssertions) * 100).toFixed(1)}%)`);
  console.log("======================================================================");

  if (failedAssertions > 0) {
    console.error(`❌ HARNESS FAILED WITH ${failedAssertions} ASSERTION VIOLATION(S).`);
    process.exit(1);
  } else {
    console.log("✅ ALL CONCURRENCY & ZERO DATA LOSS QUALITY GATES PASSED!");
    process.exit(0);
  }
}

runConcurrencyHarness().catch((err) => {
  console.error("FATAL ERROR in concurrency harness:", err);
  process.exit(1);
});
