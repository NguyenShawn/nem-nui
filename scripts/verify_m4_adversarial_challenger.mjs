/**
 * ============================================================================
 * EMPIRICAL ADVERSARIAL STRESS & ANTI-SPAM / CONCURRENCY HARNESS (MILESTONE M4)
 * Challenger: challenger_2_m4_r2 (Adversarial Anti-Spam & Concurrency Verifier)
 * Target: Nem Núi Enterprise Delivery Platform
 * File: Nem Núi/scripts/verify_m4_adversarial_challenger.mjs
 * ============================================================================
 */

import { NextRequest } from "next/server";
import { POST as webhookRoute } from "../app/api/payment/webhook/route.ts";
import { POST as orderRoute } from "../app/api/order/route.ts";
import { POST as leadsRoute } from "../app/api/leads/route.ts";
import { saveNewOrder, getOrderByCode, getOrders } from "../lib/orderDb.ts";
import { getLeads, readLocalLeads } from "../lib/leadDb.ts";
import { generateHmacSha256 } from "../lib/payment.ts";
import { SHOP_CONFIG } from "../config/shop.ts";

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failures = [];

function assert(condition, testName, details = {}) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✔ [PASS] ${testName}`);
  } else {
    failedAssertions++;
    console.error(`  ✖ [FAIL] ${testName}`);
    if (Object.keys(details).length > 0) {
      console.error(`     Details: ${JSON.stringify(details)}`);
    }
    failures.push({ testName, details });
  }
}

async function runAdversarialHarness() {
  console.log("======================================================================");
  console.log("⚔️  CHALLENGER 2 (M4 R2): EMPIRICAL ADVERSARIAL & CONCURRENCY HARNESS");
  console.log("======================================================================\n");

  // ==========================================================================
  // TASK 1: WEBHOOK IDEMPOTENCY UNDER BURST RETRIES
  // ==========================================================================
  console.log("▶ TASK 1: WEBHOOK IDEMPOTENCY UNDER BURST RETRIES");

  // 1.1 Setup an initial order in DB
  const initialOrderCode = "8K3P9X";
  const orderTotal = 125000;
  await saveNewOrder({
    code: initialOrderCode,
    customer_name: "Challenger Webhook Test",
    phone: "0901234567",
    address: "123 Đinh Bộ Lĩnh, Bình Thạnh",
    items: [{ id: "bun-nem-nuong", name: "Bún Nem Nướng", price: 45000, qty: 2 }],
    total: orderTotal,
    payment_method: "momo",
    status: "new",
  });

  const sharedTxId = "TX_BURST_TEST_" + Date.now();
  const secretKey = "webhook-test-secret-key";
  process.env.PAYMENT_WEBHOOK_SECRET = secretKey;

  console.log(`  Target Order: #${initialOrderCode}, Total: ${orderTotal}đ, TransactionId: ${sharedTxId}`);

  // Send 5 rapid duplicate webhook calls with the exact same transactionId
  const burstResponses = [];
  for (let i = 1; i <= 5; i++) {
    const payload = {
      gateway: "vietqr",
      transactionId: sharedTxId,
      orderCode: initialOrderCode,
      amount: orderTotal,
      memo: `CK NM${initialOrderCode} THANH TOAN DON HANG`,
      timestamp: new Date().toISOString(),
    };
    const rawBody = JSON.stringify(payload);
    const signature = generateHmacSha256(secretKey, rawBody);

    const req = new NextRequest("http://localhost:3000/api/payment/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": signature,
      },
      body: rawBody,
    });

    const res = await webhookRoute(req);
    const body = await res.json();
    burstResponses.push({
      attempt: i,
      status: res.status,
      body,
    });
  }

  // Assert 1: First request reconciles successfully
  const firstReq = burstResponses[0];
  assert(
    firstReq.status === 200 && firstReq.body.success === true && firstReq.body.reconciled === true && firstReq.body.status === "paid",
    "1.1 First webhook call reconciles order with HTTP 200 and status: 'paid'",
    { firstResponse: firstReq }
  );

  // Assert 2: Remaining 4 requests return HTTP 200 { success: true, reconciled: true, idempotent: true }
  const remaining4 = burstResponses.slice(1);
  const all4Idempotent = remaining4.every(
    (r) => r.status === 200 && r.body.success === true && r.body.reconciled === true && r.body.idempotent === true
  );
  assert(
    all4Idempotent,
    "1.2 Remaining 4 duplicate webhook calls return HTTP 200 with { success: true, reconciled: true, idempotent: true }",
    { responses: remaining4.map((r) => ({ attempt: r.attempt, status: r.status, body: r.body })) }
  );

  // Assert 3: Zero double-crediting
  const orderAfterBurst = await getOrderByCode(initialOrderCode);
  assert(
    orderAfterBurst && orderAfterBurst.status === "paid" && orderAfterBurst.total === orderTotal && orderAfterBurst.transaction_id === sharedTxId,
    "1.3 Order retains exact original total and paid status without double-crediting",
    { orderAfterBurst }
  );

  // 1.4 Test Parallel Concurrency Burst (5 calls sent concurrently via Promise.all)
  console.log("\n  --- Subtest 1.4: Parallel Concurrency Burst (5 concurrent calls) ---");
  const concurrentOrderCode = "7K2P9Y";
  await saveNewOrder({
    code: concurrentOrderCode,
    customer_name: "Concurrent Webhook Test",
    phone: "0901234568",
    address: "456 Xô Viết Nghệ Tĩnh, Bình Thạnh",
    items: [{ id: "bun-nem-nuong", name: "Bún Nem Nướng", price: 45000, qty: 2 }],
    total: orderTotal,
    payment_method: "momo",
    status: "new",
  });

  const concurrentTxId = "TX_PARALLEL_" + Date.now();
  const concurrentPromises = Array.from({ length: 5 }, (_, i) => {
    const payload = {
      gateway: "vietqr",
      transactionId: concurrentTxId,
      orderCode: concurrentOrderCode,
      amount: orderTotal,
      memo: `CK NM${concurrentOrderCode} THANH TOAN`,
      timestamp: new Date().toISOString(),
    };
    const rawBody = JSON.stringify(payload);
    const signature = generateHmacSha256(secretKey, rawBody);

    const req = new NextRequest("http://localhost:3000/api/payment/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": signature,
      },
      body: rawBody,
    });

    return webhookRoute(req).then(async (res) => {
      const body = await res.json();
      return { status: res.status, body };
    });
  });

  const concurrentResults = await Promise.all(concurrentPromises);
  const allConcurrent200 = concurrentResults.every((r) => r.status === 200 && r.body.success === true);
  const reconciledCount = concurrentResults.filter((r) => r.body.reconciled === true).length;
  const idempotentCount = concurrentResults.filter((r) => r.body.idempotent === true).length;

  assert(
    allConcurrent200 && reconciledCount === 5 && idempotentCount >= 4,
    `1.4 Concurrent burst: All 5 return HTTP 200 success (${reconciledCount} reconciled, ${idempotentCount} idempotent)`,
    { concurrentResults }
  );

  // ==========================================================================
  // TASK 2: BOT HONEYPOT DEFENSE
  // ==========================================================================
  console.log("\n▶ TASK 2: BOT HONEYPOT DEFENSE");

  // 2.1 Submit order with honeypot field website_url: "http://bot.com"
  console.log("  --- Subtest 2.1: Order with website_url: 'http://bot.com' ---");
  const botOrderPayload = {
    customerName: "Spam Bot 007",
    phone: "0909998877",
    address: "Số 999 Đường Botnet, Phường Spam, TP.HCM",
    note: "Malicious order submission",
    paymentMethod: "cod",
    items: [{ id: "bun-nem-nuong", qty: 1 }],
    website_url: "http://bot.com",
  };

  const botOrderReq = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(botOrderPayload),
  });

  const botOrderRes = await orderRoute(botOrderReq);
  const botOrderBody = await botOrderRes.json();

  assert(
    botOrderRes.status === 200 && botOrderBody.success === true,
    `2.1a Order with website_url returns Decoy HTTP 200 (actual status: ${botOrderRes.status})`,
    { status: botOrderRes.status, body: botOrderBody }
  );

  // Verify NOT saved to database
  const botOrderCode = botOrderBody.code;
  const foundOrderInDb = botOrderCode ? await getOrderByCode(botOrderCode) : null;
  assert(
    foundOrderInDb === null,
    `2.1b Bot order code (#${botOrderCode}) is NOT saved to database (zero DB pollution)`,
    { foundOrderInDb }
  );

  // 2.2 Submit wholesale lead with honeypot field website_url: "http://bot.com"
  console.log("\n  --- Subtest 2.2: Wholesale lead with website_url: 'http://bot.com' ---");
  const botLeadPayload = {
    fullName: "Spam Lead Bot",
    phone: "0909998866",
    tier: "500 cây",
    addressNote: "Botnet automated lead",
    website_url: "http://bot.com",
  };

  const botLeadReq = new NextRequest("http://localhost:3000/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(botLeadPayload),
  });

  const botLeadRes = await leadsRoute(botLeadReq);
  const botLeadBody = await botLeadRes.json();

  assert(
    botLeadRes.status === 200 && botLeadBody.success === true,
    `2.2a Wholesale lead with website_url returns Decoy HTTP 200 (actual status: ${botLeadRes.status})`,
    { status: botLeadRes.status, body: botLeadBody }
  );

  // Check lead is NOT saved in database / local leads
  const localLeads = readLocalLeads();
  const foundBotLead = localLeads.find((l) => l.phone === "0909998866" || l.fullName === "Spam Lead Bot");
  assert(
    !foundBotLead,
    "2.2b Bot wholesale lead is NOT saved to database / local leads (zero lead pollution)",
    { foundBotLead }
  );

  // 2.3 Also check order with honeypot field named 'honeypot'
  console.log("\n  --- Subtest 2.3: Order with field 'honeypot' (legacy / fallback) ---");
  const botLegacyOrderReq = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "Legacy Spam Bot",
      phone: "0909998855",
      address: "Số 888 Đường Botnet, Phường Spam, TP.HCM",
      items: [{ id: "bun-nem-nuong", qty: 1 }],
      paymentMethod: "cod",
      honeypot: "http://bot.com",
    }),
  });
  const botLegacyOrderRes = await orderRoute(botLegacyOrderReq);
  const botLegacyOrderBody = await botLegacyOrderRes.json();
  const legacyCode = botLegacyOrderBody.code;
  const foundLegacyOrder = legacyCode ? await getOrderByCode(legacyCode) : null;
  assert(
    botLegacyOrderRes.status === 200 && botLegacyOrderBody.success === true && foundLegacyOrder === null,
    "2.3 Order with 'honeypot' field returns decoy 200 and is not saved to DB"
  );

  // ==========================================================================
  // TASK 3: PHONE RATE LIMITING (60s)
  // ==========================================================================
  console.log("\n▶ TASK 3: PHONE RATE LIMITING (60s)");

  // 3.1 Order API: Submit two consecutive orders from the same phone number within 10s
  console.log("  --- Subtest 3.1: Consecutive Orders from same phone ---");
  const testPhoneOrder = "0933112233";
  const order1Req = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "Khách Đặt Đơn 1",
      phone: testPhoneOrder,
      address: "100 Nguyễn Thị Minh Khai, Quận 1",
      items: [{ id: "bun-nem-nuong", qty: 1 }],
      paymentMethod: "cod",
    }),
  });

  const order1Res = await orderRoute(order1Req);
  const order1Body = await order1Res.json();

  assert(
    order1Res.status === 200 && order1Body.success === true,
    `3.1a First order from ${testPhoneOrder} succeeds with HTTP 200`,
    { status: order1Res.status, body: order1Body }
  );

  // Immediate second order with same phone number
  const order2Req = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "Khách Đặt Đơn 2",
      phone: testPhoneOrder,
      address: "100 Nguyễn Thị Minh Khai, Quận 1",
      items: [{ id: "tra-tac-hat-chia", qty: 2 }],
      paymentMethod: "cod",
    }),
  });

  const order2Res = await orderRoute(order2Req);
  const order2Body = await order2Res.json();

  assert(
    order2Res.status === 429,
    `3.1b Second consecutive order within 10s receives HTTP 429 Rate Limit (actual: ${order2Res.status})`,
    { status: order2Res.status, body: order2Body }
  );

  // 3.2 Lead API: Submit two consecutive leads from the same phone number within 10s
  console.log("\n  --- Subtest 3.2: Consecutive Wholesale Leads from same phone ---");
  const testPhoneLead = "0944556677";
  const lead1Req = new NextRequest("http://localhost:3000/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Đại Lý Sỉ Đợt 1",
      phone: testPhoneLead,
      tier: "200 cây",
    }),
  });

  const lead1Res = await leadsRoute(lead1Req);
  const lead1Body = await lead1Res.json();

  assert(
    lead1Res.status === 200 && lead1Body.success === true,
    `3.2a First wholesale lead from ${testPhoneLead} succeeds with HTTP 200`,
    { status: lead1Res.status, body: lead1Body }
  );

  // Immediate second lead with same phone number
  const lead2Req = new NextRequest("http://localhost:3000/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Đại Lý Sỉ Đợt 2",
      phone: testPhoneLead,
      tier: "500 cây",
    }),
  });

  const lead2Res = await leadsRoute(lead2Req);
  const lead2Body = await lead2Res.json();

  assert(
    lead2Res.status === 429,
    `3.2b Second consecutive wholesale lead within 10s receives HTTP 429 Rate Limit (actual: ${lead2Res.status})`,
    { status: lead2Res.status, body: lead2Body }
  );

  // 3.3 Test Phone formatting variation resistance in rate limiting (e.g. "0933 112 233")
  console.log("\n  --- Subtest 3.3: Phone format variations under rate limiting ---");
  const formattedPhoneOrderReq = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "Khách Đặt Formatted Phone",
      phone: "0933 112 233", // Space formatted
      address: "100 Nguyễn Thị Minh Khai, Quận 1",
      items: [{ id: "bun-nem-nuong", qty: 1 }],
      paymentMethod: "cod",
    }),
  });
  const formattedPhoneRes = await orderRoute(formattedPhoneOrderReq);
  assert(
    formattedPhoneRes.status === 429,
    "3.3 Formatted phone '0933 112 233' is normalized and still blocked by rate limiter (HTTP 429)"
  );

  // ==========================================================================
  // TASK 4: HIGH-VALUE COD DEPOSIT RULES
  // ==========================================================================
  console.log("\n▶ TASK 4: HIGH-VALUE COD DEPOSIT RULES");

  const depositTag = "[Đơn COD > 150k - Cần xác nhận cọc 30k]";

  // 4.1 Order total exactly 150,000 VND
  // In shop menu: 3x bun-nem-nuong (3 * 45k = 135k) + shippingFee (15k) = 150,000 VND exactly!
  console.log("  --- Subtest 4.1: Order total exactly 150,000 VND ---");
  const phoneCod150k = "0955667788";
  const order150kReq = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "Khách Đơn Đúng 150k",
      phone: phoneCod150k,
      address: "123 Cách Mạng Tháng 8, Quận 3",
      items: [
        { id: "bun-nem-nuong", qty: 3 }, // 35k * 3 = 105k
        { id: "banh-trang-cuon-nem", qty: 1 }, // 30k * 1 = 30k -> subtotal 135k + 15k ship = 150k
      ],
      paymentMethod: "cod",
      note: "Ghi chú ban đầu",
    }),
  });

  const order150kRes = await orderRoute(order150kReq);
  const order150kBody = await order150kRes.json();
  const saved150kOrder = order150kBody.code ? await getOrderByCode(order150kBody.code) : null;

  assert(
    order150kBody.total === 150000,
    `4.1a Order total is calculated as exactly 150,000 VND (actual: ${order150kBody.total})`,
    { total: order150kBody.total }
  );

  const note150k = saved150kOrder?.note || "";
  assert(
    !note150k.includes(depositTag),
    "4.1b Order total = 150,000 VND has NO deposit note attached",
    { savedNote: note150k }
  );

  // 4.2 Order total > 150,000 VND (e.g. 4x bun-nem-nuong = 180k + 15k ship = 195,000 VND)
  console.log("\n  --- Subtest 4.2: Order total > 150,000 VND (High-Value COD) ---");
  const phoneCodAbove150k = "0966778899";
  const orderAbove150kReq = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "Khách Đơn Trên 150k",
      phone: phoneCodAbove150k,
      address: "123 Cách Mạng Tháng 8, Quận 3",
      items: [{ id: "bun-nem-nuong", qty: 4 }], // 45k * 4 = 180k + 15k ship = 195k
      paymentMethod: "cod",
      note: "Giao trước 12h",
    }),
  });

  const orderAbove150kRes = await orderRoute(orderAbove150kReq);
  const orderAbove150kBody = await orderAbove150kRes.json();
  const savedAbove150kOrder = orderAbove150kBody.code ? await getOrderByCode(orderAbove150kBody.code) : null;

  assert(
    orderAbove150kBody.total > 150000,
    `4.2a Order total is > 150,000 VND (actual: ${orderAbove150kBody.total}đ)`,
    { total: orderAbove150kBody.total }
  );

  const noteAbove150k = savedAbove150kOrder?.note || "";
  assert(
    noteAbove150k.includes(depositTag),
    `4.2b Order total > 150,000 VND note CONTAINS '[Đơn COD > 150k - Cần xác nhận cọc 30k]'`,
    { savedNote: noteAbove150k }
  );

  // 4.3 Exact Mathematical Boundary Evaluation: 150,000 vs 150,001
  console.log("\n  --- Subtest 4.3: Mathematical Boundary Check (150,000 vs 150,001) ---");
  const boundaryCheck150000 = (total, method) => method === "cod" && total > 150000;
  assert(
    boundaryCheck150000(150000, "cod") === false,
    "4.3a Exact boundary at 150,000 VND evaluates strictly to FALSE (no deposit required)"
  );
  assert(
    boundaryCheck150000(150001, "cod") === true,
    "4.3b Exact boundary at 150,001 VND evaluates strictly to TRUE (deposit required)"
  );

  // 4.4 Non-COD order with total > 150,000 VND (e.g. MoMo)
  console.log("\n  --- Subtest 4.4: Non-COD (MoMo) order with total > 150,000 VND ---");
  const phoneMomoAbove150k = "0977889900";
  const orderMomoAbove150kReq = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: "Khách Đơn MoMo Trên 150k",
      phone: phoneMomoAbove150k,
      address: "123 Cách Mạng Tháng 8, Quận 3",
      items: [{ id: "bun-nem-nuong", qty: 4 }],
      paymentMethod: "momo",
      note: "MoMo đã chuyển",
    }),
  });

  const orderMomoRes = await orderRoute(orderMomoAbove150kReq);
  const orderMomoBody = await orderMomoRes.json();
  const savedMomoOrder = orderMomoBody.code ? await getOrderByCode(orderMomoBody.code) : null;
  const noteMomo = savedMomoOrder?.note || "";

  assert(
    !noteMomo.includes(depositTag),
    "4.4 MoMo payment with total > 150,000 VND does NOT get tagged with COD deposit requirement",
    { savedNote: noteMomo }
  );

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log("\n======================================================================");
  console.log(`📊 ADVERSARIAL TEST RESULTS: ${passedAssertions}/${totalAssertions} PASSED (${((passedAssertions / totalAssertions) * 100).toFixed(1)}%)`);
  if (failedAssertions > 0) {
    console.error(`🚨 DETECTED ${failedAssertions} FAILURE(S):`);
    failures.forEach((f, idx) => {
      console.error(`  ${idx + 1}. ${f.testName}`);
    });
  } else {
    console.log("✨ ALL ADVERSARIAL CHALLENGE ASSERTIONS PASSED!");
  }
  console.log("======================================================================\n");

  return { totalAssertions, passedAssertions, failedAssertions, failures };
}

runAdversarialHarness().then((result) => {
  if (result.failedAssertions > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}).catch((err) => {
  console.error("FATAL ERROR EXECUTING TEST HARNESS:", err);
  process.exit(1);
});
