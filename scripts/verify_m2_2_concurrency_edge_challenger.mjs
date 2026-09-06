/**
 * ============================================================================
 * EMPIRICAL ADVERSARIAL STRESS & EDGE-CASE CHALLENGE: MILESTONE M2 (GEN 2)
 * Challenger M2-2: Concurrency, Zero Data Loss & Boundary Payload Resilience
 * Target: Nem Núi Enterprise Delivery Platform
 * File: Nem Núi/scripts/verify_m2_2_concurrency_edge_challenger.mjs
 * ============================================================================
 */

import { NextRequest } from "next/server";
import { POST as orderApiRoute } from "../app/api/order/route.ts";
import { saveNewOrder, getOrderByCode, isUniqueViolation, getOrders } from "../lib/orderDb.ts";
import { isSupabaseConfigured, supabaseAdmin } from "../lib/supabase.ts";
import { SHOP_CONFIG } from "../config/shop.ts";

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

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
  }
}

async function runEmpiricalChallenge() {
  console.log("======================================================================");
  console.log("⚔️  CHALLENGER M2-2: CONCURRENCY, ZERO DATA LOSS & EDGE-CASE CHALLENGE");
  console.log(`📦 Persistence Mode : ${isSupabaseConfigured ? "SUPABASE POSTGRESQL (Cloud)" : "IN-MEMORY FALLBACK (Isolated Engine)"}`);
  console.log("======================================================================\n");

  // ==========================================================================
  // SECTION 1: CONCURRENT ORDER CREATION (20 CONCURRENT ORDERS)
  // ==========================================================================
  console.log("▶ STAGE 1: HIGH CONCURRENCY STRESS TEST (20 CONCURRENT ORDERS)");
  const concurrencyCount = 20;
  const startTs = Date.now();

  const concurrentRequests = Array.from({ length: concurrencyCount }, (_, i) => {
    const paddedIdx = String(i + 1).padStart(2, "0");
    const phone = `091${String(10000000 + i).slice(1)}`; // 0910000000 to 0910000019 (10 digits)
    const reqBody = {
      customerName: `Khách Đồng Thời ${paddedIdx} Nguyễn`,
      phone: phone,
      address: `Số ${100 + i} Đường Thử Nghiệm Concurrency, Phường ${i + 1}, Quận Bình Tân`,
      note: `Giao lúc ${11 + (i % 5)}h - Đơn hàng stress test số ${i + 1}`,
      paymentMethod: i % 2 === 0 ? "cod" : "momo",
      items: [
        { id: "bun-nem-nuong", qty: 1 + (i % 3) }, // 45k * qty
        { id: "tra-tac-hat-chia", qty: 1 + (i % 2) }, // 15k * qty
      ],
    };

    const nextReq = new NextRequest("http://localhost:3000/api/order", {
      method: "POST",
      body: JSON.stringify(reqBody),
    });

    return orderApiRoute(nextReq).then(async (res) => {
      const data = await res.json();
      return {
        idx: i + 1,
        statusCode: res.status,
        body: data,
        expectedItems: reqBody.items,
        customerName: reqBody.customerName,
        phone: reqBody.phone,
      };
    });
  });

  const batchResults = await Promise.all(concurrentRequests);
  const elapsed = Date.now() - startTs;
  console.log(`  ⏱️  Executed ${concurrencyCount} concurrent orders in ${elapsed}ms (~${(concurrencyCount / (elapsed / 1000)).toFixed(1)} req/s)\n`);

  // 1.1 Verify all returned HTTP 200 and success === true
  const successfulOrders = batchResults.filter((r) => r.statusCode === 200 && r.body.success === true);
  assert(
    successfulOrders.length === concurrencyCount,
    `All ${concurrencyCount} concurrent orders returned HTTP 200 with success: true (${successfulOrders.length}/${concurrencyCount})`,
    { failedOrders: batchResults.filter((r) => r.statusCode !== 200) }
  );

  // 1.2 Verify all order codes are 6-character Crockford Base32
  const orderCodes = successfulOrders.map((r) => r.body.code);
  const crockfordRegex = /^[2-9A-HJ-NP-Z]{6}$/;
  const allMatchCrockford = orderCodes.every((c) => crockfordRegex.test(c));
  assert(
    allMatchCrockford,
    `All ${concurrencyCount} order codes strictly match 6-character Crockford Base32 (no 0, O, 1, I)`
  );

  // 1.3 Verify zero collisions across returned order codes
  const uniqueCodeSet = new Set(orderCodes);
  assert(
    uniqueCodeSet.size === concurrencyCount,
    `Zero code collisions: Exactly ${uniqueCodeSet.size}/${concurrencyCount} unique order codes generated`
  );

  // ==========================================================================
  // SECTION 2: ZERO DATA LOSS & FINANCIAL RECONCILIATION
  // ==========================================================================
  console.log("\n▶ STAGE 2: ZERO DATA LOSS & RELATIONAL INTEGRITY VERIFICATION");

  let totalExpectedRevenue = 0;
  let totalPersistedRevenue = 0;
  let verifiedItemCount = 0;
  let expectedItemCount = 0;

  for (const res of successfulOrders) {
    const code = res.body.code;
    const orderRecord = await getOrderByCode(code);

    assert(
      orderRecord !== null,
      `Order #${res.idx} (${code}) retrieved from persistence layer`
    );

    if (orderRecord) {
      // Calculate expected financial total
      const bunQty = 1 + ((res.idx - 1) % 3);
      const traQty = 1 + ((res.idx - 1) % 2);
      const expectedSubtotal = 45000 * bunQty + 15000 * traQty;
      const expectedTotal = expectedSubtotal + SHOP_CONFIG.shippingFee;

      totalExpectedRevenue += expectedTotal;
      totalPersistedRevenue += orderRecord.total;

      assert(
        orderRecord.total === expectedTotal,
        `Order #${res.idx} (${code}) total exactly matches (${orderRecord.total}đ === ${expectedTotal}đ)`
      );

      assert(
        orderRecord.customer_name === res.customerName,
        `Order #${res.idx} (${code}) customer name intact (${orderRecord.customer_name})`
      );

      assert(
        orderRecord.phone === res.phone,
        `Order #${res.idx} (${code}) phone number intact (${orderRecord.phone})`
      );

      // Verify line items
      expectedItemCount += 2;
      if (Array.isArray(orderRecord.items) && orderRecord.items.length === 2) {
        verifiedItemCount += 2;
        const bunItem = orderRecord.items.find((i) => i.id === "bun-nem-nuong");
        const traItem = orderRecord.items.find((i) => i.id === "tra-tac-hat-chia");

        assert(
          bunItem && bunItem.qty === bunQty && traItem && traItem.qty === traQty,
          `Order #${res.idx} (${code}) line items preserved with exact quantities (${bunQty}x Bún, ${traQty}x Trà)`
        );
      }
    }
  }

  assert(
    totalPersistedRevenue === totalExpectedRevenue && totalExpectedRevenue > 0,
    `Financial Audit: Persisted total revenue (${totalPersistedRevenue.toLocaleString()}đ) strictly matches expected revenue (${totalExpectedRevenue.toLocaleString()}đ)`
  );

  assert(
    verifiedItemCount === expectedItemCount,
    `Relational Item Audit: All ${verifiedItemCount}/${expectedItemCount} order line items accurately stored without data truncation`
  );

  // ==========================================================================
  // SECTION 3: BOUNDARY PAYLOADS & EDGE CASE CHALLENGES
  // ==========================================================================
  console.log("\n▶ STAGE 3: BOUNDARY PAYLOADS & ADVERSARIAL EDGE CASES");

  // 3.1 Edge Case: Customer Name Length Boundaries
  console.log("  --- Test 3.1: Customer Name Length Boundaries ---");
  // 3.1.1 Below Min (1 character) -> Should reject with 400
  const reqName1Char = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    body: JSON.stringify({
      customerName: "A",
      phone: "0908111222",
      address: "123 Đường Biên Độ Cực Ngắn, Phường 1, Quận 1",
      items: [{ id: "bun-nem-nuong", qty: 1 }],
    }),
  });
  const resName1Char = await orderApiRoute(reqName1Char);
  assert(
    resName1Char.status === 400,
    "Customer name of 1 character (< 2) rejected with HTTP 400"
  );

  // 3.1.2 Exactly Min (2 characters e.g. 'Lê') -> Should accept (200)
  const reqName2Char = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    body: JSON.stringify({
      customerName: "Lê",
      phone: "0908111223",
      address: "123 Đường Biên Độ Tối Thiểu, Phường 1, Quận 1",
      items: [{ id: "bun-nem-nuong", qty: 1 }],
    }),
  });
  const resName2Char = await orderApiRoute(reqName2Char);
  assert(
    resName2Char.status === 200,
    "Customer name of exactly 2 characters ('Lê') accepted with HTTP 200"
  );

  // 3.1.3 Exactly Max (50 characters) -> Should accept (200)
  const name50Char = "Nguyễn Hoàng Minh Trần Lê Đặng Bùi Vũ Ngô Dương 50";
  const reqName50Char = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    body: JSON.stringify({
      customerName: name50Char.slice(0, 50),
      phone: "0908111224",
      address: "123 Đường Biên Độ Tối Đa 50 Ký Tự, Phường 1, Quận 1",
      items: [{ id: "bun-nem-nuong", qty: 1 }],
    }),
  });
  const resName50Char = await orderApiRoute(reqName50Char);
  assert(
    resName50Char.status === 200,
    "Customer name of exactly 50 characters accepted with HTTP 200"
  );

  // 3.1.4 Exceeding Max (51 characters) -> Should reject with 400
  const name51Char = "A".repeat(51);
  const reqName51Char = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    body: JSON.stringify({
      customerName: name51Char,
      phone: "0908111225",
      address: "123 Đường Vượt Biên 51 Ký Tự, Phường 1, Quận 1",
      items: [{ id: "bun-nem-nuong", qty: 1 }],
    }),
  });
  const resName51Char = await orderApiRoute(reqName51Char);
  assert(
    resName51Char.status === 400,
    "Customer name of 51 characters (> 50) rejected with HTTP 400"
  );

  // 3.2 Edge Case: Special Characters, Vietnamese Diacritics, SQLi & XSS Strings
  console.log("\n  --- Test 3.2: Special Characters, Vietnamese Diacritics, SQLi & XSS Strings ---");
  const specialCustomerName = "Đỗ Cẩm Tú (Test #!@$%^&*()_+~`{}|[]:;?><,./)";
  const specialAddress = "123/45/6A Phan Xích Long 🏠, P. 2, Q. Phú Nhuận (Lầu 3, gõ chuông #03)";
  const reqSpecialChars = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    body: JSON.stringify({
      customerName: specialCustomerName,
      phone: "0908111226",
      address: specialAddress,
      items: [{ id: "nem-nuong-dac-biet", qty: 1 }],
    }),
  });
  const resSpecialChars = await orderApiRoute(reqSpecialChars);
  const bodySpecialChars = await resSpecialChars.json();
  assert(
    resSpecialChars.status === 200 && bodySpecialChars.success === true,
    "Special characters, symbols, and emoji in customer name/address processed successfully"
  );
  if (bodySpecialChars.code) {
    const rec = await getOrderByCode(bodySpecialChars.code);
    assert(
      rec?.customer_name === specialCustomerName && rec?.address === specialAddress,
      "Special characters and emoji preserved verbatim in storage without corruption"
    );
  }

  // SQL Injection and XSS Payload Simulation
  const sqliName = "Robert'); DROP TABLE orders;--";
  const xssAddress = "<script>alert('XSS')</script> 123 Đường Hacker, Quận 1";
  const reqSqli = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    body: JSON.stringify({
      customerName: sqliName,
      phone: "0908111227",
      address: xssAddress,
      items: [{ id: "bun-nem-nuong", qty: 1 }],
    }),
  });
  const resSqli = await orderApiRoute(reqSqli);
  const bodySqli = await resSqli.json();
  assert(
    resSqli.status === 200 && bodySqli.success === true,
    "SQL injection & XSS attack payload treated safely as literal strings"
  );
  if (bodySqli.code) {
    const rec = await getOrderByCode(bodySqli.code);
    assert(
      rec?.customer_name === sqliName && rec?.address === xssAddress,
      "SQLi and XSS strings safely persisted as escaped/parameterized text"
    );
  }

  // 3.3 Edge Case: Address Length Boundaries
  console.log("\n  --- Test 3.3: Address Length Boundaries ---");
  // 3.3.1 Below Min (9 chars) -> Reject 400
  const reqAddr9Char = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    body: JSON.stringify({
      customerName: "Nguyễn Văn Test",
      phone: "0908111228",
      address: "123 Đường", // 9 chars
      items: [{ id: "bun-nem-nuong", qty: 1 }],
    }),
  });
  const resAddr9Char = await orderApiRoute(reqAddr9Char);
  assert(
    resAddr9Char.status === 400,
    "Address of 9 characters (< 10) rejected with HTTP 400"
  );

  // 3.3.2 Exactly Min (10 chars) -> Accept 200
  const reqAddr10Char = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    body: JSON.stringify({
      customerName: "Nguyễn Văn Test",
      phone: "0908111229",
      address: "1234567890", // 10 chars
      items: [{ id: "bun-nem-nuong", qty: 1 }],
    }),
  });
  const resAddr10Char = await orderApiRoute(reqAddr10Char);
  assert(
    resAddr10Char.status === 200,
    "Address of exactly 10 characters accepted with HTTP 200"
  );

  // 3.3.3 Exactly Max (200 chars) -> Accept 200
  const addr200 = "Số 123 Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, Thành phố Hồ Chí Minh, Việt Nam. Ghi chú chi tiết: Tòa nhà văn phòng Tower B, tầng 18, phòng 1802. Khi đến vui lòng gọi điện thoại trước 10 phút nhé shop.".slice(0, 200);
  const reqAddr200Char = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    body: JSON.stringify({
      customerName: "Nguyễn Văn Test",
      phone: "0908111230",
      address: addr200,
      items: [{ id: "bun-nem-nuong", qty: 1 }],
    }),
  });
  const resAddr200Char = await orderApiRoute(reqAddr200Char);
  assert(
    resAddr200Char.status === 200,
    "Address of exactly 200 characters accepted with HTTP 200"
  );

  // 3.3.4 Exceeding Max (201 chars) -> Reject 400
  const addr201 = "A".repeat(201);
  const reqAddr201Char = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    body: JSON.stringify({
      customerName: "Nguyễn Văn Test",
      phone: "0908111231",
      address: addr201,
      items: [{ id: "bun-nem-nuong", qty: 1 }],
    }),
  });
  const resAddr201Char = await orderApiRoute(reqAddr201Char);
  assert(
    resAddr201Char.status === 400,
    "Address of 201 characters (> 200) rejected with HTTP 400"
  );

  // 3.4 Edge Case: Extreme Note Length (> 500 characters) & Safe Truncation
  console.log("\n  --- Test 3.4: Extreme Note Truncation ---");
  const extremeNote = "Ghi chú dài 1000 ký tự: " + "Nem nướng giòn rụm nhiều rau sống ít ớt ".repeat(30);
  const reqExtremeNote = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    body: JSON.stringify({
      customerName: "Khách Ghi Chú Cực Dài",
      phone: "0908111232",
      address: "123 Đường Thử Nghiệm Note Truncation, Quận 1",
      note: extremeNote,
      items: [{ id: "bun-nem-nuong", qty: 1 }],
    }),
  });
  const resExtremeNote = await orderApiRoute(reqExtremeNote);
  const bodyExtremeNote = await resExtremeNote.json();
  assert(
    resExtremeNote.status === 200 && bodyExtremeNote.success === true,
    "Order with 1000+ character note accepted without crashing or truncation error"
  );
  if (bodyExtremeNote.code) {
    const rec = await getOrderByCode(bodyExtremeNote.code);
    assert(
      rec?.note && rec.note.length <= 500,
      `Note safely clamped to 500 characters in persistence (Actual length: ${rec?.note?.length})`
    );
  }

  // 3.5 Edge Case: Phone Number Formats & Rate Limiting
  console.log("\n  --- Test 3.5: Phone Number Formats & Rate Limiting ---");
  // 3.5.1 International prefix +84
  const reqPhone84 = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    body: JSON.stringify({
      customerName: "Khách Số Điện Thoại +84",
      phone: "+84908111233",
      address: "123 Đường Quốc Tế, Phường 1, Quận 1",
      items: [{ id: "bun-nem-nuong", qty: 1 }],
    }),
  });
  const resPhone84 = await orderApiRoute(reqPhone84);
  assert(
    resPhone84.status === 200,
    "Valid international Vietnamese phone (+84908111233) accepted with HTTP 200"
  );

  // 3.5.2 Consecutive duplicate order from same phone within 60s -> HTTP 429
  const reqDuplicatePhone = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    body: JSON.stringify({
      customerName: "Khách Spam Đơn Cùng Số",
      phone: "+84908111233", // Same phone immediately
      address: "123 Đường Quốc Tế, Phường 1, Quận 1",
      items: [{ id: "bun-nem-nuong", qty: 1 }],
    }),
  });
  const resDuplicatePhone = await orderApiRoute(reqDuplicatePhone);
  assert(
    resDuplicatePhone.status === 429,
    "Immediate second order with same phone within 60s throttled with HTTP 429 Rate Limit"
  );

  // 3.5.3 Invalid phone: letters, short, or obsolete prefix
  const reqInvalidPhone = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    body: JSON.stringify({
      customerName: "Khách Phone Sai",
      phone: "0123456789", // 11-digit old prefix
      address: "123 Đường Sai Phone, Phường 1, Quận 1",
      items: [{ id: "bun-nem-nuong", qty: 1 }],
    }),
  });
  const resInvalidPhone = await orderApiRoute(reqInvalidPhone);
  assert(
    resInvalidPhone.status === 400,
    "Invalid/obsolete phone prefix (0123456789) rejected with HTTP 400"
  );

  // 3.6 Edge Case: Anti-Spam Honeypot Detection
  console.log("\n  --- Test 3.6: Anti-Spam Honeypot Detection ---");
  const reqHoneypot = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    body: JSON.stringify({
      customerName: "Spam Bot 3000",
      phone: "0908999000",
      address: "123 Bot Street, Cyberspace",
      honeypot: "I am a malicious bot auto-filling hidden inputs",
      items: [{ id: "bun-nem-nuong", qty: 1 }],
    }),
  });
  const resHoneypot = await orderApiRoute(reqHoneypot);
  const bodyHoneypot = await resHoneypot.json();
  assert(
    resHoneypot.status === 200 && bodyHoneypot.success === true,
    "Honeypot bot receives dummy HTTP 200 success response"
  );
  const botCode = bodyHoneypot.code;
  const botOrderInDb = await getOrderByCode(botCode);
  assert(
    botOrderInDb === null,
    "Honeypot bot order is NOT saved to the database (zero database pollution)"
  );

  // 3.7 Edge Case: Minimum Order Amount Enforcement
  console.log("\n  --- Test 3.7: Minimum Order Amount Enforcement ---");
  // Item total 15,000đ (< 30,000đ min order) -> 400
  const reqBelowMin = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    body: JSON.stringify({
      customerName: "Khách Mua Dưới Tối Thiểu",
      phone: "0908111234",
      address: "123 Đường Dưới Tối Thiểu, Quận 1",
      items: [{ id: "tra-tac-hat-chia", qty: 1 }], // Only 15k
    }),
  });
  const resBelowMin = await orderApiRoute(reqBelowMin);
  assert(
    resBelowMin.status === 400,
    "Order subtotal 15.000đ below shop minimum (30.000đ) rejected with HTTP 400"
  );

  // 3.8 Edge Case: Price Tampering Defense (Server-Side Price Recalculation)
  console.log("\n  --- Test 3.8: Server-Side Price Recalculation (Anti-Tampering) ---");
  const reqTamperedPrice = new NextRequest("http://localhost:3000/api/order", {
    method: "POST",
    body: JSON.stringify({
      customerName: "Khách Hack Giá",
      phone: "0908111235",
      address: "123 Đường Thử Nghiệm Hack Giá, Quận 1",
      items: [{ id: "bun-nem-nuong", price: 1000, qty: 1 }], // Client claims price is 1.000đ instead of 45.000đ
    }),
  });
  const resTamperedPrice = await orderApiRoute(reqTamperedPrice);
  const bodyTamperedPrice = await resTamperedPrice.json();
  const expectedOfficialTotal = 45000 + SHOP_CONFIG.shippingFee; // 60,000đ
  assert(
    bodyTamperedPrice.total === expectedOfficialTotal,
    `Server overrides client-tampered price: calculated total is ${bodyTamperedPrice.total}đ (expected ${expectedOfficialTotal}đ)`
  );

  // ==========================================================================
  // FINAL SUMMARY
  // ==========================================================================
  console.log("\n======================================================================");
  console.log(`📊 CHALLENGER M2-2 SUMMARY: ${passedAssertions}/${totalAssertions} Passed (${((passedAssertions / totalAssertions) * 100).toFixed(1)}%)`);
  console.log("======================================================================");

  if (failedAssertions > 0) {
    console.error(`❌ HARNESS FAILED WITH ${failedAssertions} ASSERTION VIOLATION(S).`);
    process.exit(1);
  } else {
    console.log("🎉 ALL ADVERSARIAL CONCURRENCY & EDGE-CASE QUALITY GATES PASSED 100%!");
    process.exit(0);
  }
}

runEmpiricalChallenge().catch((err) => {
  console.error("FATAL ERROR in Challenger M2-2 Harness:", err);
  process.exit(1);
});
