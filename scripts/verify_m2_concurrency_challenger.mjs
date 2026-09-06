/**
 * ============================================================================
 * EMPIRICAL ADVERSARIAL CHALLENGE SUITE: MILESTONE M2 (GEN 2)
 * Challenger M2-1: Database Concurrency & Failure Resilience
 * Target: Nem Núi Enterprise Delivery Platform
 * File: Nem Núi/scripts/verify_m2_concurrency_challenger.mjs
 * ============================================================================
 */

import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { POST as orderApiRoute } from "../app/api/order/route.ts";
import { saveNewOrder, getOrderByCode, isUniqueViolation } from "../lib/orderDb.ts";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function report(name, passed, details = "") {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`  ✔ [CHALLENGE PASS] ${name}`);
  } else {
    failedTests++;
    console.error(`  ✖ [CHALLENGE FAIL] ${name} ${details ? "- " + details : ""}`);
  }
}

async function runAdversarialSuite() {
  console.log("======================================================================");
  console.log("🔥 EMPIRICAL ADVERSARIAL VERIFICATION: MILESTONE M2 DEFECT RESOLUTION");
  console.log("======================================================================\n");

  const routeFilePath = path.resolve("app/api/order/route.ts");
  const routeContent = fs.readFileSync(routeFilePath, "utf8");

  // --------------------------------------------------------------------------
  // SECTION 1: CHALLENGE 1 - ORDER CODE DESYNCHRONIZATION ON COLLISION RETRY
  // --------------------------------------------------------------------------
  console.log("▶ TEST SECTION 1: ORDER CODE DESYNCHRONIZATION RESOLUTION");

  // 1.1 Static AST & Data-Flow Inspection of route.ts
  const capturesSaveResult = /const\s+saveResult\s*=\s*await\s+saveNewOrder\s*\(/.test(routeContent);
  report("route.ts explicitly captures saveResult from await saveNewOrder()", capturesSaveResult);

  const computesConfirmedCode = /const\s+confirmedOrderCode\s*=\s*saveResult\.code\s*\|\|\s*saveResult\.order\?\.code\s*\|\|\s*orderCode;/.test(routeContent);
  report("route.ts derives confirmedOrderCode from saveResult.code / saveResult.order.code", computesConfirmedCode);

  const sheetsUsesConfirmedCode = /sendOrderToGoogleSheets\s*\(\s*\{[\s\S]*?orderCode:\s*confirmedOrderCode/.test(routeContent);
  report("Google Sheets notification is dispatched using confirmedOrderCode", sheetsUsesConfirmedCode);

  const discordUsesConfirmedCode = /sendDiscordOrderNotification\s*\(\s*\{[\s\S]*?orderCode:\s*confirmedOrderCode/.test(routeContent);
  report("Discord notification is dispatched using confirmedOrderCode", discordUsesConfirmedCode);

  const responseUsesConfirmedCode = /return\s+NextResponse\.json\s*\(\s*\{[\s\S]*?code:\s*confirmedOrderCode/.test(routeContent);
  report("Client JSON response returns confirmedOrderCode", responseUsesConfirmedCode);

  // 1.2 Empirical execution of orderApiRoute verifying persistence synchronization
  const req = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    body: JSON.stringify({
      customerName: "Khách Thử Nghiệm Đồng Bộ",
      phone: "0909555111",
      address: "123 Đường Kiểm Định Đồng Bộ, Quận 1",
      paymentMethod: "cod",
      items: [{ id: "bun-nem-nuong", qty: 1 }],
    }),
  });

  const res = await orderApiRoute(req);
  const body = await res.json();

  report("orderApiRoute successfully returns HTTP 200 for valid order", res.status === 200);
  report("orderApiRoute returns valid order code in body", typeof body.code === "string" && body.code.length === 6);

  const persistedOrder = await getOrderByCode(body.code);
  report(
    "Persisted database record exactly matches returned order code",
    persistedOrder !== null && persistedOrder.code === body.code && persistedOrder.customer_name === "Khách Thử Nghiệm Đồng Bộ"
  );

  // --------------------------------------------------------------------------
  // SECTION 2: CHALLENGE 2 - SILENT DATABASE FAILURE RETURNING HTTP 200
  // --------------------------------------------------------------------------
  console.log("\n▶ TEST SECTION 2: DATABASE FAILURE & STRUCTURED HTTP 500 HANDLING");

  const handlesFailureBlock = /if\s*\(\s*!saveResult\.success\s*\)\s*\{[\s\S]*?return\s+NextResponse\.json\s*\([\s\S]*?status:\s*500[\s\S]*?\};?\s*\}/.test(routeContent);
  report("route.ts checks !saveResult.success and immediately returns structured HTTP 500", handlesFailureBlock);

  const returnsErrorField = /error:\s*saveResult\.error\s*\|\|/.test(routeContent);
  report("route.ts propagates saveResult.error in the 500 error payload", returnsErrorField);

  // --------------------------------------------------------------------------
  // SECTION 3: CHALLENGE 3 - IN-MEMORY FALLBACK DUPLICATION & ID COLLISIONS
  // --------------------------------------------------------------------------
  console.log("\n▶ TEST SECTION 3: IN-MEMORY FALLBACK DUPLICATION & ID COLLISIONS");

  // 3.1 Stress test: 100 concurrent orders dispatched in the same tick
  const batchSize = 100;
  console.log(`  ℹ Stress testing ${batchSize} concurrent orders in the same event tick...`);
  const concurrentPromises = Array.from({ length: batchSize }, (_, i) => {
    return saveNewOrder({
      customer_name: `Khách Hàng Stress ${i + 1}`,
      phone: `0908${String(i).padStart(6, "0")}`,
      address: `Địa chỉ số ${i + 1}, Phường 1, TP HCM`,
      payment_method: "cod",
      items: [{ id: "bun-nem-nuong", name: "Bún Nem", price: 45000, qty: 1 }],
      total: 60000,
    });
  });

  const batchResults = await Promise.all(concurrentPromises);
  const allSucceeded = batchResults.every((r) => r.success === true);
  report(`All ${batchSize} concurrent orders succeeded`, allSucceeded);

  const generatedIds = batchResults.map((r) => r.order.id);
  const uniqueIds = new Set(generatedIds);
  report(`All ${batchSize} order IDs are strictly unique (${uniqueIds.size}/${batchSize}) - no millisecond collision`, uniqueIds.size === batchSize);

  const generatedCodes = batchResults.map((r) => r.code);
  const uniqueCodes = new Set(generatedCodes);
  report(`All ${batchSize} order codes are strictly unique (${uniqueCodes.size}/${batchSize})`, uniqueCodes.size === batchSize);

  // 3.2 Inject known collision into in-memory fallback
  const firstOrder = batchResults[0];
  const existingCode = firstOrder.code;
  console.log(`  ℹ Injecting collision with existing code #${existingCode}...`);

  const collisionInput = {
    code: existingCode,
    customer_name: "Khách Hàng Trùng Mã In-Memory",
    phone: "0909999777",
    address: "789 Đường Thử Nghiệm Xung Đột, Quận 5",
    payment_method: "cod",
    items: [{ id: "bun-nem-nuong", name: "Bún Nem", price: 45000, qty: 1 }],
    total: 60000,
  };

  const collisionRes = await saveNewOrder(collisionInput);
  report("In-memory collision retry recovers successfully", collisionRes.success === true);
  report("In-memory regenerated code differs from collided code", collisionRes.code !== existingCode);

  const fetchedOriginal = await getOrderByCode(existingCode);
  const fetchedNew = await getOrderByCode(collisionRes.code);
  report(
    "Original order under collided code remains intact (not overwritten)",
    fetchedOriginal !== null && fetchedOriginal.customer_name === firstOrder.order.customer_name
  );
  report(
    "New order persisted under regenerated code",
    fetchedNew !== null && fetchedNew.customer_name === "Khách Hàng Trùng Mã In-Memory"
  );

  // 3.3 Postgres 23505 Classifier verification
  report(
    "isUniqueViolation handles PostgreSQL error code 23505",
    isUniqueViolation({ code: "23505" }) === true
  );
  report(
    "isUniqueViolation handles Postgres unique constraint message",
    isUniqueViolation({ message: "duplicate key value violates unique constraint" }) === true
  );
  report(
    "isUniqueViolation handles PostgREST already exists details",
    isUniqueViolation({ details: "Key (code)=(ABC123) already exists." }) === true
  );
  report(
    "isUniqueViolation rejects unrelated errors (e.g. 42P01 table missing)",
    isUniqueViolation({ code: "42P01" }) === false
  );
  report(
    "isUniqueViolation safely returns false for null/undefined/empty input",
    isUniqueViolation(null) === false && isUniqueViolation(undefined) === false && isUniqueViolation({}) === false
  );

  // --------------------------------------------------------------------------
  // SECTION 4: CHALLENGE 4 - HARNESS INTEGRITY AUDIT
  // --------------------------------------------------------------------------
  console.log("\n▶ TEST SECTION 4: HARNESS INTEGRITY AUDIT (GATE 4 IN TEST_CONCURRENCY_ORDERS.MJS)");

  const harnessPath = path.resolve("scripts/test_concurrency_orders.mjs");
  const harnessContent = fs.readFileSync(harnessPath, "utf8");

  const hasSyntheticMockInsert = harnessContent.includes("const mockInsert =");
  report("Gate 4 has completely removed the synthetic mockInsert closure", !hasSyntheticMockInsert);

  const testsRealSaveNewOrder = harnessContent.includes("await saveNewOrder(collisionPayload)");
  report("Gate 4 tests actual DAL saveNewOrder for collision retry", testsRealSaveNewOrder);

  const testsRealApiRoute = harnessContent.includes("orderApiRoute(directReq)");
  report("Gate 4 tests actual Next.js /api/order route execution and synchronization", testsRealApiRoute);

  const testsPostgres23505Classifier = harnessContent.includes("isUniqueViolation({ code: \"23505\"");
  report("Gate 4 validates PostgreSQL 23505 error classifier logic", testsPostgres23505Classifier);

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n======================================================================");
  console.log(`📊 ADVERSARIAL CHALLENGE RESULTS: ${passedTests}/${totalTests} Passed (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log("======================================================================");

  if (failedTests > 0) {
    console.error(`❌ VERIFICATION FAILED: ${failedTests} assertion(s) violated.`);
    process.exit(1);
  } else {
    console.log("✅ ALL ADVERSARIAL CHALLENGES EMPIRICALLY SATISFIED!");
    process.exit(0);
  }
}

runAdversarialSuite().catch((err) => {
  console.error("Fatal error in adversarial verification suite:", err);
  process.exit(1);
});
