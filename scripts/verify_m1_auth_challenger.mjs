/**
 * ============================================================================
 * CHALLENGER 1 EMPIRICAL VERIFICATION HARNESS: M1 AUTH PENETRATION & SECRET LEAK
 * ============================================================================
 * Tests live HTTP requests against running Next.js server (http://localhost:3001)
 * AND tests direct route handlers with NextRequest.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, "..");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "nemnui_admin_secret_2026";
const ADMIN_PIN = process.env.ADMIN_PIN || "99887766";

console.log("================================================================");
console.log("🛡️  CHALLENGER 1: AUTH PENETRATION & SECRET AUDIT HARNESS");
console.log(`🎯 Target Base URL: ${BASE_URL}`);
console.log(`🔑 Configured Secret: ${ADMIN_SECRET}`);
console.log(`🔢 Configured PIN: ${ADMIN_PIN}`);
console.log("================================================================\n");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

function recordResult(category, testName, passed, expected, actual, extra = {}) {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`  ✅ [PASS] [${category}] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] [${category}] ${testName}`);
    console.error(`     Expected: ${JSON.stringify(expected)}`);
    console.error(`     Actual:   ${JSON.stringify(actual)}`);
  }
  results.push({ category, testName, passed, expected, actual, ...extra });
}

async function fetchHttp(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, options);
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    return { status: res.status, ok: res.ok, body, headers: Object.fromEntries(res.headers.entries()) };
  } catch (err) {
    return { status: -1, ok: false, error: err.message };
  }
}

async function runTests() {
  console.log("--- PART 1: MANDATORY SPECIFICATION CHALLENGES (HTTP LIVE) ---");

  // 1. GET /api/leads with no header -> must return HTTP 401
  {
    const res = await fetchHttp("/api/leads");
    const passed = res.status === 401 && res.body?.success === false;
    recordResult(
      "Mandatory 1",
      "GET /api/leads without headers returns HTTP 401",
      passed,
      { status: 401, success: false },
      { status: res.status, body: res.body }
    );
  }

  // 2. GET /api/leads with invalid Bearer token -> must return HTTP 401
  {
    const res = await fetchHttp("/api/leads", {
      headers: { Authorization: "Bearer invalid_bearer_token_12345" },
    });
    const passed = res.status === 401 && res.body?.success === false;
    recordResult(
      "Mandatory 2",
      "GET /api/leads with invalid Bearer token returns HTTP 401",
      passed,
      { status: 401, success: false },
      { status: res.status, body: res.body }
    );
  }

  // 3a. GET /api/leads with valid Authorization: Bearer nemnui_admin_secret_2026 -> must return HTTP 200
  {
    const res = await fetchHttp("/api/leads", {
      headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
    });
    const passed = res.status === 200 && res.body?.success === true && Array.isArray(res.body?.leads);
    recordResult(
      "Mandatory 3a",
      `GET /api/leads with valid Authorization: Bearer ${ADMIN_SECRET} returns HTTP 200`,
      passed,
      { status: 200, success: true },
      { status: res.status, body: res.body }
    );
  }

  // 3b. GET /api/leads with valid x-admin-key: nemnui_admin_secret_2026 -> must return HTTP 200
  {
    const res = await fetchHttp("/api/leads", {
      headers: { "x-admin-key": ADMIN_SECRET },
    });
    const passed = res.status === 200 && res.body?.success === true && Array.isArray(res.body?.leads);
    recordResult(
      "Mandatory 3b",
      `GET /api/leads with valid x-admin-key: ${ADMIN_SECRET} returns HTTP 200`,
      passed,
      { status: 200, success: true },
      { status: res.status, body: res.body }
    );
  }

  // 4. GET /api/admin/orders?pin=99887766 without headers -> must return HTTP 401 (URL query PIN must NOT bypass auth)
  {
    const res = await fetchHttp(`/api/admin/orders?pin=${ADMIN_PIN}`);
    const passed = res.status === 401 && res.body?.success === false;
    recordResult(
      "Mandatory 4",
      `GET /api/admin/orders?pin=${ADMIN_PIN} without headers returns HTTP 401 (No URL query bypass)`,
      passed,
      { status: 401, success: false },
      { status: res.status, body: res.body }
    );
  }

  // 5. GET /api/admin/orders with x-admin-pin: 99887766 -> must return HTTP 200
  {
    const res = await fetchHttp("/api/admin/orders", {
      headers: { "x-admin-pin": ADMIN_PIN },
    });
    const passed = res.status === 200 && res.body?.success === true && Array.isArray(res.body?.orders);
    recordResult(
      "Mandatory 5",
      `GET /api/admin/orders with x-admin-pin: ${ADMIN_PIN} returns HTTP 200`,
      passed,
      { status: 200, success: true },
      { status: res.status, body: res.body }
    );
  }

  console.log("\n--- PART 2: ADVERSARIAL PENETRATION CHALLENGES ---");

  // 6. Adversarial: URL Query injection attacks on leads
  {
    const res = await fetchHttp(`/api/leads?token=${ADMIN_SECRET}`);
    const passed = res.status === 401;
    recordResult(
      "Adversarial",
      "GET /api/leads?token=<secret> in query fails with 401",
      passed,
      401,
      res.status
    );
  }

  // 7. Adversarial: Legacy PIN query bypass attempt
  {
    const res = await fetchHttp("/api/admin/orders?pin=1234");
    const passed = res.status === 401;
    recordResult(
      "Adversarial",
      "GET /api/admin/orders?pin=1234 legacy PIN in query fails with 401",
      passed,
      401,
      res.status
    );
  }

  // 8. Adversarial: Wrong PIN in x-admin-pin header
  {
    const res = await fetchHttp("/api/admin/orders", {
      headers: { "x-admin-pin": "wrong_pin_0000" },
    });
    const passed = res.status === 401;
    recordResult(
      "Adversarial",
      "GET /api/admin/orders with invalid x-admin-pin fails with 401",
      passed,
      401,
      res.status
    );
  }

  // 9. Adversarial: Authorization header format tampering
  {
    const res = await fetchHttp("/api/leads", {
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });
    const passed = res.status === 401;
    recordResult(
      "Adversarial",
      "GET /api/leads with Basic Auth scheme fails with 401",
      passed,
      401,
      res.status
    );
  }

  // 10. Adversarial: Empty Bearer token
  {
    const res = await fetchHttp("/api/leads", {
      headers: { Authorization: "Bearer " },
    });
    const passed = res.status === 401;
    recordResult(
      "Adversarial",
      "GET /api/leads with empty Bearer token fails with 401",
      passed,
      401,
      res.status
    );
  }

  // 11. Adversarial: Admin menu endpoint query bypass attempt
  {
    const res = await fetchHttp(`/api/admin/menu?pin=${ADMIN_PIN}`);
    const passed = res.status === 401;
    recordResult(
      "Adversarial",
      `GET /api/admin/menu?pin=${ADMIN_PIN} without headers fails with 401`,
      passed,
      401,
      res.status
    );
  }

  // 12. Adversarial: Admin menu endpoint with valid x-admin-pin
  {
    const res = await fetchHttp("/api/admin/menu", {
      headers: { "x-admin-pin": ADMIN_PIN },
    });
    const passed = res.status === 200 && res.body?.success === true;
    recordResult(
      "Adversarial",
      `GET /api/admin/menu with valid x-admin-pin: ${ADMIN_PIN} returns 200`,
      passed,
      { status: 200, success: true },
      { status: res.status, body: res.body }
    );
  }

  // 13. Public Endpoint Isolation: POST /api/leads should remain accessible for customers
  {
    const res = await fetchHttp("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Challenger Test Lead",
        phone: "0987654321",
        tier: "100 cây",
        tierLabel: "100 cây",
        addressNote: "Adversarial Auth Verification",
      }),
    });
    const passed = res.status === 200 && res.body?.success === true;
    recordResult(
      "Boundary Isolation",
      "Public POST /api/leads remains operational without requiring admin token (200 OK)",
      passed,
      { status: 200, success: true },
      { status: res.status, body: res.body }
    );
  }

  console.log("\n--- PART 3: CLIENT BUNDLE STATIC SECRET AUDIT ---");

  // 14. Static Chunk Scan: Check for "adminPin"
  {
    const chunksDir = path.resolve(APP_ROOT, ".next/static/chunks");
    let matchesAdminPin = [];
    let scannedFilesCount = 0;

    function walkDir(dir) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(full);
        } else if (entry.isFile() && entry.name.endsWith(".js")) {
          scannedFilesCount++;
          const content = fs.readFileSync(full, "utf-8");
          if (content.includes("adminPin")) {
            matchesAdminPin.push(path.relative(APP_ROOT, full));
          }
        }
      }
    }

    walkDir(chunksDir);

    const passed = matchesAdminPin.length === 0 && scannedFilesCount > 0;
    recordResult(
      "Static Audit",
      `Search .next/static/chunks/ for "adminPin" (Scanned ${scannedFilesCount} chunks)`,
      passed,
      { occurrences: 0 },
      { occurrences: matchesAdminPin.length, matches: matchesAdminPin }
    );
  }

  // 15. Static Chunk Scan: Check for secret PIN "99887766"
  {
    const chunksDir = path.resolve(APP_ROOT, ".next/static/chunks");
    let matchesPin = [];

    function walkDir(dir) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(full);
        } else if (entry.isFile() && entry.name.endsWith(".js")) {
          const content = fs.readFileSync(full, "utf-8");
          if (content.includes(ADMIN_PIN)) {
            matchesPin.push(path.relative(APP_ROOT, full));
          }
        }
      }
    }

    walkDir(chunksDir);

    const passed = matchesPin.length === 0;
    recordResult(
      "Static Audit",
      `Search .next/static/chunks/ for PIN "${ADMIN_PIN}"`,
      passed,
      { occurrences: 0 },
      { occurrences: matchesPin.length, matches: matchesPin }
    );
  }

  // 16. Static Chunk Scan: Check for secret token "nemnui_admin_secret_2026"
  {
    const chunksDir = path.resolve(APP_ROOT, ".next/static/chunks");
    let matchesSecret = [];

    function walkDir(dir) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(full);
        } else if (entry.isFile() && entry.name.endsWith(".js")) {
          const content = fs.readFileSync(full, "utf-8");
          if (content.includes(ADMIN_SECRET)) {
            matchesSecret.push(path.relative(APP_ROOT, full));
          }
        }
      }
    }

    walkDir(chunksDir);

    const passed = matchesSecret.length === 0;
    recordResult(
      "Static Audit",
      `Search .next/static/chunks/ for ADMIN_SECRET "${ADMIN_SECRET}"`,
      passed,
      { occurrences: 0 },
      { occurrences: matchesSecret.length, matches: matchesSecret }
    );
  }

  // 17. Source Config Check: SHOP_CONFIG in config/shop.ts must NOT have adminPin
  {
    const shopConfigPath = path.resolve(APP_ROOT, "config/shop.ts");
    const content = fs.readFileSync(shopConfigPath, "utf-8");
    const hasAdminPin = content.includes("adminPin");
    recordResult(
      "Config Audit",
      "config/shop.ts does not export or declare adminPin",
      !hasAdminPin,
      { hasAdminPin: false },
      { hasAdminPin }
    );
  }

  // 18. Image Config Check: next.config.mjs must NOT contain wildcard '**'
  {
    const nextConfigPath = path.resolve(APP_ROOT, "next.config.mjs");
    const content = fs.readFileSync(nextConfigPath, "utf-8");
    const hasWildcard = content.includes("'**'") || content.includes('"**"');
    recordResult(
      "Config Audit",
      "next.config.mjs remotePatterns does not contain wildcard '**'",
      !hasWildcard,
      { hasWildcard: false },
      { hasWildcard }
    );
  }

  console.log("\n================================================================");
  console.log(`📊 FINAL RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log(`VERDICT: ${failedTests === 0 ? "APPROVE" : "REJECT"}`);
  console.log("================================================================");

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
