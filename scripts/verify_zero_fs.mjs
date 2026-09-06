/**
 * Nem Núi/scripts/verify_zero_fs.mjs
 * Static Analysis Gate: Enforces Zero fs synchronous I/O in lib/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LIB_DIR = path.resolve(__dirname, "..", "lib");

console.log("======================================================================");
console.log("🔍 STATIC ANALYSIS GATE: ENFORCE ZERO fs.* IN lib/");
console.log(`📂 Scanning Directory: ${LIB_DIR}`);
console.log("======================================================================\n");

const FORBIDDEN_PATTERNS = [
  { name: "readFileSync", regex: /\bfs\.readFileSync\b|\breadFileSync\b/g },
  { name: "writeFileSync", regex: /\bfs\.writeFileSync\b|\bwriteFileSync\b/g },
  { name: "fs import", regex: /import\s+.*?\s+from\s+["']fs(?:\/promises)?["']|require\s*\(\s*["']fs(?:\/promises)?["']\s*\)/g },
  { name: "path import for local JSON", regex: /orders_db\.json|menu_db\.json|leads_db\.json/g },
];

function scanDirectory(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = scanDirectory(LIB_DIR);
let violationCount = 0;

for (const file of files) {
  const content = fs.readFileSync(file, "utf-8");
  const relPath = path.relative(path.resolve(__dirname, ".."), file);
  const lines = content.split("\n");

  lines.forEach((line, lineIdx) => {
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.regex.test(line)) {
        violationCount++;
        console.error(`❌ VIOLATION [${pattern.name}]: ${relPath}:${lineIdx + 1}`);
        console.error(`   ${line.trim()}`);
      }
    }
  });
}

console.log("\n----------------------------------------------------------------------");
console.log(`Scanned ${files.length} source files in lib/. Found ${violationCount} violation(s).`);
console.log("----------------------------------------------------------------------");

if (violationCount === 0) {
  console.log("✅ STATIC CHECK PASSED: 0 occurrences of synchronous fs operations in lib/.");
  process.exit(0);
} else {
  console.error(`❌ STATIC CHECK FAILED: Found ${violationCount} forbidden fs calls in lib/.`);
  process.exit(1);
}
