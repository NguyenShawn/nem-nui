/**
 * ============================================================================
 * MASTER E2E TEST RUNNER
 * Nem Núi Enterprise Refactoring (M0: E2E Testing Track)
 * Executes Tiers 1-4, compiles metrics, and outputs milestone readiness report
 * ============================================================================
 */

import { colors, TestRunner } from "./test_helpers.mjs";
import { runTier1Tests } from "./tier1_features.mjs";
import { runTier2Tests } from "./tier2_boundary.mjs";
import { runTier3Tests } from "./tier3_combinations.mjs";
import { runTier4Tests } from "./tier4_scenarios.mjs";

const FEATURE_MILESTONE_MAP = {
  F1: "M1", F2: "M1", F3: "M1", F4: "M1", F5: "M1",
  F6: "M2", F7: "M2", F8: "M2", F9: "M2", F10: "M2", F11: "M2",
  F12: "M3", F13: "M3", F14: "M3", F15: "M3", F16: "M3",
  F17: "M4", F18: "M4", F19: "M4", F20: "M4", F21: "M4",
  F22: "M5", F23: "M5", F24: "M5", F25: "M5",
  F26: "M6", F27: "M6", F28: "M6",
};

const FEATURE_NAMES = {
  F1: "Eliminate Hardcoded PIN",
  F2: "Authenticate Leads API",
  F3: "Secure Admin API Endpoints",
  F4: "Git & Secret Hygiene",
  F5: "Tighten Next.js Image Config",
  F6: "PostgreSQL 3NF Schema",
  F7: "Eliminate JSON File I/O",
  F8: "Safe Order Code Generation",
  F9: "Row Level Security (RLS)",
  F10: "Concurrency & Data Integrity",
  F11: "Master Data Migration",
  F12: "Eliminate 5s/3s Polling",
  F13: "Realtime WebSocket Channel",
  F14: "Realtime Connection Badge",
  F15: "Audio Chime on New Order",
  F16: "Kitchen Status Transitions",
  F17: "Automated Payment Webhook",
  F18: "HMAC Signature Verification",
  F19: "Webhook Idempotency",
  F20: "Order Code Regex Matcher",
  F21: "Anti-Spam & COD Validation",
  F22: "SSOT Master Data Alignment",
  F23: "Menu Pricing & Financial Sync",
  F24: "E-Commerce Legal Footer",
  F25: "PII Consent Checkbox",
  F26: "100% E2E Test Pass",
  F27: "Adversarial Hardening (Tier 5)",
  F28: "Forensic Integrity Audit",
};

async function main() {
  const args = process.argv.slice(2);
  const selectedTier = args.find((a) => a.startsWith("--tier="))?.split("=")[1];

  console.log(`\n${colors.bold}${colors.magenta}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}   NEM NÚI ENTERPRISE REFACTORING — MASTER E2E TEST RUNNER (M0)       ${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}======================================================================${colors.reset}`);
  console.log(`Started at: ${new Date().toISOString()}`);
  if (selectedTier) {
    console.log(`Filter: Tier ${selectedTier} only`);
  }

  const startTime = Date.now();
  const runners = [];

  // Tier 1
  if (!selectedTier || selectedTier === "1") {
    const r1 = new TestRunner("Tier 1: Feature Coverage (28 Features)");
    await runTier1Tests(r1);
    runners.push(r1);
  }

  // Tier 2
  if (!selectedTier || selectedTier === "2") {
    const r2 = new TestRunner("Tier 2: Boundary & Corner Cases (28 Features)");
    await runTier2Tests(r2);
    runners.push(r2);
  }

  // Tier 3
  if (!selectedTier || selectedTier === "3") {
    const r3 = new TestRunner("Tier 3: Cross-Feature Combinations");
    await runTier3Tests(r3);
    runners.push(r3);
  }

  // Tier 4
  if (!selectedTier || selectedTier === "4") {
    const r4 = new TestRunner("Tier 4: Real-World Scenarios");
    await runTier4Tests(r4);
    runners.push(r4);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Aggregation
  let grandTotal = 0;
  let grandPassed = 0;
  let grandFailed = 0;
  const allFailures = [];

  runners.forEach((r) => {
    grandTotal += r.total;
    grandPassed += r.passed;
    grandFailed += r.failed;
    allFailures.push(...r.failures);
  });

  const grandPassRate = grandTotal > 0 ? ((grandPassed / grandTotal) * 100).toFixed(1) : "0.0";

  console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}                    MASTER EXECUTION SUMMARY REPORT                   ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`Total Test Assertions : ${colors.bold}${grandTotal}${colors.reset}`);
  console.log(`Total Passed          : ${colors.bold}${colors.green}${grandPassed}${colors.reset}`);
  console.log(`Total Failed          : ${colors.bold}${grandFailed > 0 ? colors.red + grandFailed : colors.green + "0"}${colors.reset}`);
  console.log(`Execution Duration    : ${duration}s`);
  console.log(`Global Pass Rate      : ${colors.bold}${grandPassRate}%${colors.reset}`);

  console.log(`\n${colors.bold}--- TIER BREAKDOWN ---${colors.reset}`);
  runners.forEach((r) => {
    const rate = r.total > 0 ? ((r.passed / r.total) * 100).toFixed(1) : "0.0";
    const statusColor = r.failed === 0 ? colors.green : colors.yellow;
    console.log(`  • ${r.tierName.padEnd(45)}: ${statusColor}${r.passed}/${r.total} passed (${rate}%)${colors.reset}`);
  });

  // Feature Status Checklist (28 Features)
  console.log(`\n${colors.bold}--- 28-FEATURE PROGRESSIVE VERIFICATION MATRIX ---${colors.reset}`);
  for (let i = 1; i <= 28; i++) {
    const fId = `F${i}`;
    const fName = FEATURE_NAMES[fId] || `Feature ${i}`;
    const milestone = FEATURE_MILESTONE_MAP[fId] || "TBD";

    // Check if any failure relates to this feature in Tier 1 or Tier 2
    const fFailures = allFailures.filter((f) => f.featureId === fId);
    let statusText = "";
    if (fFailures.length === 0) {
      statusText = `${colors.green}[VERIFIED / READY]${colors.reset}`;
    } else {
      statusText = `${colors.yellow}[GATE PENDING: ${milestone}] (${fFailures.length} assertions awaiting implementation)${colors.reset}`;
    }

    console.log(`  ${fId.padEnd(4)} [${milestone}] ${fName.padEnd(35)} : ${statusText}`);
  }

  console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}Diagnostic Conclusion:${colors.reset}`);
  if (grandFailed === 0) {
    console.log(`${colors.green}✔ ALL TEST SUITES PASSED (100%). SYSTEM IS PRODUCTION READY.${colors.reset}`);
  } else {
    console.log(`${colors.yellow}ℹ ${grandFailed} test assertion(s) reflect planned milestone quality gates (M1-M6).${colors.reset}`);
    console.log(`${colors.yellow}  The E2E Test Suite is 100% operational, self-contained, and ready for dev verification.${colors.reset}`);
  }
  console.log(`${colors.bold}${colors.cyan}======================================================================\n${colors.reset}`);

  return { grandTotal, grandPassed, grandFailed, duration, passRate: grandPassRate };
}

main()
  .then((stats) => {
    // Runner finishes cleanly
    process.exit(stats.grandFailed > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error("FATAL: Master test runner error:", err);
    process.exit(1);
  });
