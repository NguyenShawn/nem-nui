/**
 * ============================================================================
 * E2E TEST HELPERS & ASSERTION HARNESS
 * Nem Núi Enterprise Delivery Platform (M0: E2E Testing Track)
 * ============================================================================
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, "../../..");
export const APP_ROOT = path.resolve(__dirname, "../..");

// ANSI Color Codes
export const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

export class TestRunner {
  constructor(tierName) {
    this.tierName = tierName;
    this.total = 0;
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.features = {};
    this.failures = [];
    this.startTime = Date.now();
  }

  startFeature(featureId, featureName) {
    this.currentFeatureId = featureId;
    this.currentFeatureName = featureName;
    if (!this.features[featureId]) {
      this.features[featureId] = {
        name: featureName,
        total: 0,
        passed: 0,
        failed: 0,
        tests: [],
      };
    }
    console.log(`\n${colors.bold}${colors.cyan}▶ [${featureId}] ${featureName}${colors.reset}`);
  }

  assert(condition, testName, details = null) {
    this.total++;
    const feature = this.features[this.currentFeatureId] || {
      name: "Global",
      total: 0,
      passed: 0,
      failed: 0,
      tests: [],
    };
    feature.total++;

    if (condition) {
      this.passed++;
      feature.passed++;
      console.log(`  ${colors.green}✔ [PASS]${colors.reset} ${testName}`);
      feature.tests.push({ name: testName, status: "PASS" });
      return true;
    } else {
      this.failed++;
      feature.failed++;
      console.error(`  ${colors.red}✖ [FAIL]${colors.reset} ${testName}`);
      if (details) {
        console.error(`     ${colors.yellow}Reason: ${JSON.stringify(details)}${colors.reset}`);
      }
      const failureRecord = {
        tier: this.tierName,
        featureId: this.currentFeatureId,
        featureName: this.currentFeatureName,
        testName,
        details,
      };
      this.failures.push(failureRecord);
      feature.tests.push({ name: testName, status: "FAIL", details });
      return false;
    }
  }

  assertEqual(actual, expected, testName) {
    const isEq = JSON.stringify(actual) === JSON.stringify(expected);
    return this.assert(isEq, testName, { expected, actual });
  }

  assertMatch(text, regex, testName) {
    const isMatch = regex.test(text);
    return this.assert(isMatch, testName, { text: String(text).slice(0, 100), regex: regex.toString() });
  }

  printSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log(`\n${colors.bold}============================================================${colors.reset}`);
    console.log(`${colors.bold}📊 SUMMARY: ${this.tierName}${colors.reset}`);
    console.log(`============================================================`);
    console.log(`Total Tests : ${this.total}`);
    console.log(`Passed      : ${colors.green}${this.passed}${colors.reset}`);
    console.log(`Failed      : ${this.failed > 0 ? colors.red + this.failed + colors.reset : "0"}`);
    console.log(`Duration    : ${duration}s`);

    const passRate = this.total > 0 ? ((this.passed / this.total) * 100).toFixed(1) : "0.0";
    console.log(`Pass Rate   : ${this.failed === 0 ? colors.green : colors.yellow}${passRate}%${colors.reset}`);

    if (this.failures.length > 0) {
      console.log(`\n${colors.bold}${colors.red}❌ FAILED TESTS BREAKDOWN (${this.failures.length}):${colors.reset}`);
      this.failures.forEach((f, idx) => {
        console.log(`  ${idx + 1}. [${f.featureId}] ${f.testName}`);
        if (f.details) {
          console.log(`     ${colors.gray}Details: ${JSON.stringify(f.details)}${colors.reset}`);
        }
      });
    }
    console.log(`============================================================\n`);
  }
}

// ----------------------------------------------------------------------------
// File & Static Analysis Utilities
// ----------------------------------------------------------------------------

export function readAppFile(relativePath) {
  const fullPath = path.resolve(APP_ROOT, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf-8");
}

export function readProjectFile(relativePath) {
  const fullPath = path.resolve(PROJECT_ROOT, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf-8");
}

export function appFileExists(relativePath) {
  return fs.existsSync(path.resolve(APP_ROOT, relativePath));
}

export function projectFileExists(relativePath) {
  return fs.existsSync(path.resolve(PROJECT_ROOT, relativePath));
}

export function searchInFile(relativePath, regex) {
  const content = readAppFile(relativePath);
  if (!content) return false;
  return regex.test(content);
}

export function searchInProjectFile(relativePath, regex) {
  const content = readProjectFile(relativePath);
  if (!content) return false;
  return regex.test(content);
}

// ----------------------------------------------------------------------------
// Cryptographic & Payment Helpers
// ----------------------------------------------------------------------------

export function generateHmacSha256(secret, payload) {
  const data = typeof payload === "string" ? payload : JSON.stringify(payload);
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

export function timingSafeCompare(a, b) {
  try {
    if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
      return false;
    }
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------------
// Order Code & Regex Validators
// ----------------------------------------------------------------------------

export const ORDER_CODE_REGEX = /^[2-9A-HJ-NP-Z]{6}$/;
// Order codes generated either have NM prefix or 6 characters with digits/letters
export const MEMO_ORDER_CODE_REGEX = /\b(NM[2-9A-HJ-NP-Z]{4,8}|(?=[2-9A-HJ-NP-Z]*\d)[2-9A-HJ-NP-Z]{6})\b/i;
export const VN_PHONE_REGEX = /^(?:\+84|0)(?:3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;

export function extractOrderCodeFromMemo(memo) {
  if (!memo || typeof memo !== "string") return null;
  // First attempt NM prefix match
  const nmMatch = memo.match(/\bNM([2-9A-HJ-NP-Z]{4,8})\b/i);
  if (nmMatch) {
    return nmMatch[1].toUpperCase();
  }
  // Then attempt 6-char alphanumeric code with at least one digit (to avoid matching Vietnamese words like CHUYEN)
  const codeMatch = memo.match(/\b(?=[2-9A-HJ-NP-Z]*\d)[2-9A-HJ-NP-Z]{6}\b/i);
  if (codeMatch) {
    return codeMatch[0].toUpperCase();
  }
  return null;
}

export function formatVnCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}
