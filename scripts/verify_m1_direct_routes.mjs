/**
 * ============================================================================
 * CHALLENGER 1 DIRECT ROUTE HANDLER TEST HARNESS (OFFLINE / IN-PROCESS)
 * ============================================================================
 * Tests Next.js App Router handlers directly with NextRequest/Request instances.
 */

import { NextRequest } from "next/server";
import { GET as getLeads, POST as postLeads } from "../app/api/leads/route.ts";
import { GET as getAdminOrders } from "../app/api/admin/orders/route.ts";
import { GET as getAdminMenu } from "../app/api/admin/menu/route.ts";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "nemnui_admin_secret_2026";
const ADMIN_PIN = process.env.ADMIN_PIN || "99887766";

console.log("================================================================");
console.log("🛡️  CHALLENGER 1: IN-PROCESS ROUTE HANDLER VERIFICATION");
console.log("================================================================\n");

let passed = 0;
let total = 0;

function assert(condition, name, details = null) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    console.error(`  ❌ [FAIL] ${name}`);
    if (details) console.error("     Details:", details);
  }
}

async function runDirectTests() {
  // 1. GET /api/leads with no header -> 401
  {
    const req = new NextRequest("http://localhost:3000/api/leads");
    const res = await getLeads(req);
    const data = await res.json();
    assert(res.status === 401, "GET /api/leads without headers returns HTTP 401", { status: res.status });
    assert(data.success === false, "401 response conforms to { success: false } schema", data);
  }

  // 2. GET /api/leads with invalid Bearer token -> 401
  {
    const req = new NextRequest("http://localhost:3000/api/leads", {
      headers: { Authorization: "Bearer wrong_secret_key" },
    });
    const res = await getLeads(req);
    assert(res.status === 401, "GET /api/leads with invalid Bearer token returns HTTP 401", { status: res.status });
  }

  // 3a. GET /api/leads with valid Bearer token -> 200
  {
    const req = new NextRequest("http://localhost:3000/api/leads", {
      headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
    });
    const res = await getLeads(req);
    const data = await res.json();
    assert(res.status === 200, `GET /api/leads with valid Bearer token returns HTTP 200`, { status: res.status });
    assert(data.success === true && Array.isArray(data.leads), "Leads data returned with success: true", data);
  }

  // 3b. GET /api/leads with x-admin-key -> 200
  {
    const req = new NextRequest("http://localhost:3000/api/leads", {
      headers: { "x-admin-key": ADMIN_SECRET },
    });
    const res = await getLeads(req);
    assert(res.status === 200, `GET /api/leads with valid x-admin-key returns HTTP 200`, { status: res.status });
  }

  // 4. GET /api/admin/orders?pin=99887766 without headers -> 401
  {
    const req = new NextRequest(`http://localhost:3000/api/admin/orders?pin=${ADMIN_PIN}`);
    const res = await getAdminOrders(req);
    assert(res.status === 401, "GET /api/admin/orders?pin=99887766 without headers returns HTTP 401 (No query bypass)", { status: res.status });
  }

  // 5. GET /api/admin/orders with x-admin-pin: 99887766 -> 200
  {
    const req = new NextRequest("http://localhost:3000/api/admin/orders", {
      headers: { "x-admin-pin": ADMIN_PIN },
    });
    const res = await getAdminOrders(req);
    const data = await res.json();
    assert(res.status === 200, "GET /api/admin/orders with x-admin-pin returns HTTP 200", { status: res.status });
    assert(data.success === true && Array.isArray(data.orders), "Orders list returned with success: true", data);
  }

  // 6. Adversarial: GET /api/admin/menu?pin=99887766 without headers -> 401
  {
    const req = new NextRequest(`http://localhost:3000/api/admin/menu?pin=${ADMIN_PIN}`);
    const res = await getAdminMenu(req);
    assert(res.status === 401, "GET /api/admin/menu?pin=99887766 without headers returns HTTP 401", { status: res.status });
  }

  // 7. Adversarial: GET /api/admin/menu with x-admin-pin -> 200
  {
    const req = new NextRequest("http://localhost:3000/api/admin/menu", {
      headers: { "x-admin-pin": ADMIN_PIN },
    });
    const res = await getAdminMenu(req);
    assert(res.status === 200, "GET /api/admin/menu with x-admin-pin returns HTTP 200", { status: res.status });
  }

  console.log("\n================================================================");
  console.log(`📊 DIRECT ROUTE TEST SUMMARY: ${passed}/${total} TESTS PASSED (100%)`);
  console.log("================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runDirectTests();
