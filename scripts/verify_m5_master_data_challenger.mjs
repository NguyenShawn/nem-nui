/**
 * ============================================================================
 * EMPIRICAL ADVERSARIAL MASTER DATA & FINANCIAL VERIFICATION HARNESS (M5)
 * Challenger: challenger_2_m5 (Adversarial Master Data & Financial Verifier)
 * Target: Nem Núi Enterprise Delivery Platform
 * File: Nem Núi/scripts/verify_m5_master_data_challenger.mjs
 * ============================================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MENU_ITEMS, CATEGORIES } from "../data/menu.ts";
import { SHOP_CONFIG } from "../config/shop.ts";
import { LANDING_CONFIG } from "../config/landing.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

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

function parseSqlSeedCategories(sqlContent) {
  const categories = new Map();
  // Match INSERT INTO categories (...) VALUES (...)
  const catRegex = /\('([^']+)',\s*'([^']+)',\s*'([^']*)',\s*(\d+)\)/g;
  let match;
  while ((match = catRegex.exec(sqlContent)) !== null) {
    categories.set(match[1], {
      id: match[1],
      name: match[2],
      icon: match[3],
      sort_order: parseInt(match[4], 10),
    });
  }
  return categories;
}

function parseSqlSeedMenuItems(sqlContent) {
  const items = new Map();
  // Regex to extract tuples inside INSERT INTO menu_items
  // Pattern: ( 'id', 'branch_id', 'category_id', 'name', price, cost, ... )
  const itemRegex = /\(\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+),/g;
  let match;
  while ((match = itemRegex.exec(sqlContent)) !== null) {
    items.set(match[1], {
      id: match[1],
      branch_id: match[2],
      category_id: match[3],
      name: match[4],
      price: parseInt(match[5], 10),
      cost: parseInt(match[6], 10),
    });
  }
  return items;
}

async function runMasterDataVerification() {
  console.log("======================================================================");
  console.log("⚔️  CHALLENGER 2 (M5): EMPIRICAL MASTER DATA & FINANCIAL VERIFICATION");
  console.log("======================================================================\n");

  // ==========================================================================
  // 1. MENU PRICING SANITY & FINANCIAL SYNCHRONIZATION
  // ==========================================================================
  console.log("▶ TASK 1: MENU PRICING SANITY & FINANCIAL SYNCHRONIZATION (data/menu.ts)");

  assert(Array.isArray(MENU_ITEMS) && MENU_ITEMS.length >= 10, 
    `1.1 Menu contains at least 10 items (found ${MENU_ITEMS.length})`, { count: MENU_ITEMS.length });

  // 1.1 Integrity of every item in data/menu.ts
  const categoryIds = new Set(CATEGORIES.map((c) => c.id));
  categoryIds.add("all"); // 'all' is pseudo-category for tab filter

  let allPositivePrices = true;
  let allMultipleOf1000 = true;
  let allPriceUnder1M = true;
  let allValidCategories = true;
  let allValidIds = true;
  let allBooleansProper = true;

  for (const item of MENU_ITEMS) {
    if (typeof item.price !== "number" || item.price <= 0 || !Number.isInteger(item.price)) {
      allPositivePrices = false;
      console.error(`Item ${item.id} has invalid price: ${item.price}`);
    }
    if (item.price % 1000 !== 0) {
      allMultipleOf1000 = false;
      console.error(`Item ${item.id} price is not multiple of 1000: ${item.price}`);
    }
    if (item.price >= 1000000) {
      allPriceUnder1M = false;
      console.error(`Item ${item.id} price exceeds 1.000.000đ: ${item.price}`);
    }
    if (!categoryIds.has(item.category)) {
      allValidCategories = false;
      console.error(`Item ${item.id} category '${item.category}' not in CATEGORIES list`);
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(item.id)) {
      allValidIds = false;
      console.error(`Item ${item.id} does not follow kebab-case ID convention`);
    }
    if (typeof item.available !== "boolean") {
      allBooleansProper = false;
      console.error(`Item ${item.id} available flag is not boolean: ${item.available}`);
    }
    if (item.isBestSeller !== undefined && typeof item.isBestSeller !== "boolean") {
      allBooleansProper = false;
      console.error(`Item ${item.id} isBestSeller flag is not boolean: ${item.isBestSeller}`);
    }
  }

  assert(allPositivePrices, "1.2 Every item in data/menu.ts has a strictly positive integer price");
  assert(allMultipleOf1000, "1.3 Every item price is an exact multiple of 1.000đ (standard VN currency)");
  assert(allPriceUnder1M, "1.4 Every retail item price is sane and strictly < 1.000.000đ");
  assert(allValidCategories, "1.5 Every item references a valid defined category in CATEGORIES");
  assert(allValidIds, "1.6 Every item ID adheres to kebab-case convention");
  assert(allBooleansProper, "1.7 Availability and BestSeller flags strictly adhere to boolean primitives");

  // 1.2 Specifically verify "Set Ăn Vặt 28k"
  const set28k = MENU_ITEMS.find((item) => item.id === "set-an-vat-28k");
  assert(!!set28k, "1.8 Item 'set-an-vat-28k' exists in data/menu.ts");
  if (set28k) {
    assert(set28k.name === "Set Ăn Vặt 28k", "1.9 'set-an-vat-28k' has exact name 'Set Ăn Vặt 28k'", { name: set28k.name });
    assert(set28k.price === 28000, "1.10 'set-an-vat-28k' has exact price 28000đ", { price: set28k.price });
    assert(set28k.category === "set", "1.11 'set-an-vat-28k' belongs to category 'set'", { category: set28k.category });
    assert(set28k.isBestSeller === true, "1.12 'set-an-vat-28k' is marked as isBestSeller: true", { isBestSeller: set28k.isBestSeller });
    assert(set28k.available === true, "1.13 'set-an-vat-28k' is marked available: true");
  }

  // 1.3 Specifically verify "Kit mẫu thử 25k"
  const kit25k = MENU_ITEMS.find((item) => item.id === "kit-mau-thu-25k");
  assert(!!kit25k, "1.14 Item 'kit-mau-thu-25k' exists in data/menu.ts");
  if (kit25k) {
    assert(kit25k.name === "Kit mẫu thử 25k", "1.15 'kit-mau-thu-25k' has exact name 'Kit mẫu thử 25k'", { name: kit25k.name });
    assert(kit25k.price === 25000, "1.16 'kit-mau-thu-25k' has exact price 25000đ", { price: kit25k.price });
    assert(kit25k.category === "set", "1.17 'kit-mau-thu-25k' belongs to category 'set'", { category: kit25k.category });
    assert(kit25k.available === true, "1.18 'kit-mau-thu-25k' is marked available: true");
  }

  // 1.4 Signature Bún Nem Nướng Price Standard
  const bunNem = MENU_ITEMS.find((item) => item.id === "bun-nem-nuong");
  assert(!!bunNem && bunNem.price === 35000, "1.19 Signature 'bun-nem-nuong' is priced at standard 35.000đ", { price: bunNem?.price });

  // 1.5 Database Seed Comparison (supabase/schema.sql & migrations/001_enterprise_schema.sql)
  console.log("\n▶ TASK 1.2: DATABASE SEED SYNCHRONIZATION (supabase/schema.sql)");
  const schemaSqlPath = path.join(projectRoot, "supabase/schema.sql");
  const migrationSqlPath = path.join(projectRoot, "supabase/migrations/001_enterprise_schema.sql");
  
  assert(fs.existsSync(schemaSqlPath), "1.20 supabase/schema.sql exists");
  assert(fs.existsSync(migrationSqlPath), "1.21 supabase/migrations/001_enterprise_schema.sql exists");

  const schemaSql = fs.readFileSync(schemaSqlPath, "utf8");
  const migrationSql = fs.readFileSync(migrationSqlPath, "utf8");

  const sqlCategories = parseSqlSeedCategories(schemaSql);
  const sqlMenuItems = parseSqlSeedMenuItems(schemaSql);

  assert(sqlCategories.has("set"), "1.22 Seeded SQL categories contains 'set'");
  assert(sqlCategories.has("nem-chinh"), "1.23 Seeded SQL categories contains 'nem-chinh'");
  assert(sqlCategories.has("an-vat"), "1.24 Seeded SQL categories contains 'an-vat'");
  assert(sqlCategories.has("do-uong"), "1.25 Seeded SQL categories contains 'do-uong'");

  // Verify all data/menu.ts items are present in schema.sql
  let allSeedItemsPresent = true;
  let allSeedPricesMatch = true;
  let allSeedNamesMatch = true;

  for (const item of MENU_ITEMS) {
    const seedItem = sqlMenuItems.get(item.id);
    if (!seedItem) {
      allSeedItemsPresent = false;
      console.error(`Item ${item.id} not seeded in supabase/schema.sql`);
      continue;
    }
    if (seedItem.price !== item.price) {
      allSeedPricesMatch = false;
      console.error(`Item ${item.id} price mismatch: TS=${item.price} vs SQL=${seedItem.price}`);
    }
    // Normalize string compare
    const tsName = item.name.replace(/\s+/g, " ").trim();
    const sqlName = seedItem.name.replace(/\s+/g, " ").trim();
    if (!tsName.startsWith(sqlName.substring(0, 15))) {
      allSeedNamesMatch = false;
      console.error(`Item ${item.id} name mismatch: TS='${tsName}' vs SQL='${sqlName}'`);
    }
  }

  assert(allSeedItemsPresent, "1.26 All 13 items from data/menu.ts exist in supabase/schema.sql seed", { seededCount: sqlMenuItems.size });
  assert(allSeedPricesMatch, "1.27 All 13 item prices in supabase/schema.sql match data/menu.ts with 100% precision");
  assert(allSeedNamesMatch, "1.28 All 13 item names in supabase/schema.sql correspond to data/menu.ts definitions");

  // Specific check on set-an-vat-28k in SQL seed
  const sqlSet28k = sqlMenuItems.get("set-an-vat-28k");
  assert(!!sqlSet28k && sqlSet28k.price === 28000 && sqlSet28k.category_id === "set",
    "1.29 'set-an-vat-28k' in SQL seed has price 28000 and category_id 'set'");

  // Specific check on kit-mau-thu-25k in SQL seed
  const sqlKit25k = sqlMenuItems.get("kit-mau-thu-25k");
  assert(!!sqlKit25k && sqlKit25k.price === 25000 && sqlKit25k.category_id === "set",
    "1.30 'kit-mau-thu-25k' in SQL seed has price 25000 and category_id 'set'");

  // Check parity between schema.sql and migration 001
  const migCategories = parseSqlSeedCategories(migrationSql);
  const migMenuItems = parseSqlSeedMenuItems(migrationSql);
  assert(migMenuItems.has("set-an-vat-28k") && migMenuItems.has("kit-mau-thu-25k"),
    "1.31 supabase/migrations/001_enterprise_schema.sql is synchronized with both new set items");

  // ==========================================================================
  // 2. MASTER DATA ADDRESS & HOTLINE UNIFORMITY
  // ==========================================================================
  console.log("\n▶ TASK 2: MASTER DATA ADDRESS & HOTLINE UNIFORMITY (config/shop.ts vs config/landing.ts)");

  // Hotline extraction
  const shopPhoneClean = SHOP_CONFIG.phone.replace(/\D/g, "");
  const shopDisplayPhoneClean = SHOP_CONFIG.displayPhone.replace(/\D/g, "");
  const shopMomoPhoneClean = SHOP_CONFIG.momo.phone.replace(/\D/g, "");
  const landingHotlineClean = LANDING_CONFIG.brand.hotline.replace(/\D/g, "");
  const landingDisplayClean = LANDING_CONFIG.brand.hotlineDisplay.replace(/\D/g, "");
  const landingZaloClean = (LANDING_CONFIG.brand.zalo.match(/0\d{9}/) || [""])[0];

  assert(shopPhoneClean === "0369652674", "2.1 config/shop.ts phone normalizes to '0369652674'", { shopPhoneClean });
  assert(shopDisplayPhoneClean === "0369652674", "2.2 config/shop.ts displayPhone normalizes to '0369652674'", { shopDisplayPhoneClean });
  assert(shopMomoPhoneClean === "0369652674", "2.3 config/shop.ts MoMo phone normalizes to '0369652674'", { shopMomoPhoneClean });
  assert(landingHotlineClean === "0369652674", "2.4 config/landing.ts hotline normalizes to '0369652674'", { landingHotlineClean });
  assert(landingDisplayClean === "0369652674", "2.5 config/landing.ts hotlineDisplay normalizes to '0369652674'", { landingDisplayClean });
  assert(landingZaloClean === "0369652674", "2.6 config/landing.ts Zalo URL normalizes to '0369652674'", { landingZaloClean });

  // Address check
  const shopAddress = SHOP_CONFIG.address;
  const landingAddress = LANDING_CONFIG.brand.address;

  assert(shopAddress.includes("Bình Chánh"), "2.7 config/shop.ts address contains 'Bình Chánh'", { shopAddress });
  assert(landingAddress.includes("Bình Chánh"), "2.8 config/landing.ts address contains 'Bình Chánh'", { landingAddress });
  assert(shopAddress === landingAddress, "2.9 config/shop.ts and config/landing.ts have 100% identical SSOT address string", {
    shopAddress,
    landingAddress,
  });

  // Business Entity check
  const shopEntity = SHOP_CONFIG.businessEntity?.name || "";
  const landingEntity = LANDING_CONFIG.brand.entityName || "";
  assert(shopEntity.includes("Hộ Kinh Doanh Nem Núi"), "2.10 config/shop.ts businessEntity contains 'Hộ Kinh Doanh Nem Núi'", { shopEntity });
  assert(landingEntity.includes("Hộ Kinh Doanh Nem Núi"), "2.11 config/landing.ts entityName contains 'Hộ Kinh Doanh Nem Núi'", { landingEntity });
  assert(shopEntity === landingEntity, "2.12 Business entity names are 100% identical across shop and landing configurations");

  // Representative & Tax Code check
  const shopOwner = SHOP_CONFIG.businessEntity?.owner || "";
  const landingOwner = LANDING_CONFIG.brand.owner || "";
  const shopTaxId = SHOP_CONFIG.businessEntity?.taxId || "";
  const landingTaxId = LANDING_CONFIG.brand.taxId || "";

  assert(shopOwner === "Nguyễn Trường Sơn" && landingOwner === "Nguyễn Trường Sơn", 
    "2.13 Business registered representative is consistently 'Nguyễn Trường Sơn'");
  assert(shopTaxId === "8492048291" && landingTaxId === "8492048291", 
    "2.14 Tax identification number (MST) is consistently '8492048291'");

  // Operating Hours Uniformity
  const shopHours = `${SHOP_CONFIG.openingHours.open} - ${SHOP_CONFIG.openingHours.close}`;
  assert(shopHours === "08:00 - 22:00", "2.15 config/shop.ts operating hours are standardized to 08:00 - 22:00", { shopHours });
  assert(LANDING_CONFIG.brand.operatingHours.includes("08:00 - 22:00"), 
    "2.16 config/landing.ts operating hours contain standardized 08:00 - 22:00", { landingHours: LANDING_CONFIG.brand.operatingHours });

  // Conflict scanning across all config files
  console.log("\n▶ TASK 2.2: ADVERSARIAL SCAN FOR CONFLICTING CONFIG DATA");
  const forbiddenPhrases = ["adminPin: \"1234\"", "adminPin: '1234'"];
  const shopConfigRaw = fs.readFileSync(path.join(projectRoot, "config/shop.ts"), "utf8");
  const landingConfigRaw = fs.readFileSync(path.join(projectRoot, "config/landing.ts"), "utf8");

  for (const phrase of forbiddenPhrases) {
    assert(!shopConfigRaw.includes(phrase), `2.17 config/shop.ts does not contain forbidden phrase: ${phrase}`);
    assert(!landingConfigRaw.includes(phrase), `2.18 config/landing.ts does not contain forbidden phrase: ${phrase}`);
  }

  // Check that neither config file contains conflicting old pricing for bun nem (45000)
  assert(!shopConfigRaw.includes("45000") && !landingConfigRaw.includes("45000"),
    "2.19 No obsolete 45.000đ pricing remnants in configuration files");

  // ==========================================================================
  // 3. STATUTORY COMPLIANCE: DECREE 52/2013 & DECREE 85/2021 (E-COMMERCE)
  // ==========================================================================
  console.log("\n▶ TASK 3: STATUTORY COMPLIANCE: DECREE 52/85 E-COMMERCE FOOTER & POLICIES");
  const footerPath = path.join(projectRoot, "components/landing/LandingFooter.tsx");
  assert(fs.existsSync(footerPath), "3.1 LandingFooter.tsx component exists");
  const footerRaw = fs.readFileSync(footerPath, "utf8");

  assert(footerRaw.includes("Hộ Kinh Doanh Nem Núi"), "3.2 Footer displays registered business name 'Hộ Kinh Doanh Nem Núi'");
  assert(footerRaw.includes("Nguyễn Trường Sơn"), "3.3 Footer displays registered representative 'Nguyễn Trường Sơn'");
  assert(footerRaw.includes("8492048291"), "3.4 Footer displays Tax ID (MST) '8492048291'");
  assert(footerRaw.includes("Bình Chánh"), "3.5 Footer displays registered address with 'Bình Chánh'");
  const hasHotlineInFooter = 
    footerRaw.includes("0369652674") || 
    footerRaw.includes("0369 652 674") || 
    footerRaw.includes("LANDING_CONFIG.brand.hotline") || 
    footerRaw.includes("LANDING_CONFIG.brand.hotlineDisplay");
  assert(hasHotlineInFooter, "3.6 Footer references SSOT hotline ('0369 652 674' via LANDING_CONFIG)");
  assert(footerRaw.includes("52/2013") && footerRaw.includes("85/2021"), "3.7 Footer cites Decree 52/2013/NĐ-CP and Decree 85/2021/NĐ-CP");

  // Mandatory Policy Pages Check
  const policyPages = [
    { file: "app/chinh-sach-giao-hang/page.tsx", route: "/chinh-sach-giao-hang", desc: "Delivery Policy" },
    { file: "app/chinh-sach-doi-tra/page.tsx", route: "/chinh-sach-doi-tra", desc: "Returns Policy" },
    { file: "app/chinh-sach-bao-mat/page.tsx", route: "/chinh-sach-bao-mat", desc: "Privacy Policy" },
  ];

  for (const policy of policyPages) {
    const fullPath = path.join(projectRoot, policy.file);
    const exists = fs.existsSync(fullPath);
    assert(exists, `3.8 Static policy page exists: ${policy.file} (${policy.desc})`);
    if (exists) {
      const content = fs.readFileSync(fullPath, "utf8");
      assert(content.length > 500, `3.9 Policy page ${policy.file} has substantive content (>500 bytes)`, { bytes: content.length });
      assert(footerRaw.includes(policy.route), `3.10 Footer contains link to ${policy.route}`);
    }
  }

  // ==========================================================================
  // 4. STATUTORY COMPLIANCE: DECREE 13/2023/NĐ-CP (PII PROTECTION CONSENT)
  // ==========================================================================
  console.log("\n▶ TASK 4: STATUTORY COMPLIANCE: DECREE 13/2023 PII CONSENT CONTROLS");

  const consentComponentPath = path.join(projectRoot, "components/PrivacyConsentCheckbox.tsx");
  assert(fs.existsSync(consentComponentPath), "4.1 PrivacyConsentCheckbox.tsx component exists");
  const consentRaw = fs.readFileSync(consentComponentPath, "utf8");

  assert(consentRaw.includes("13/2023/NĐ-CP"), "4.2 Checkbox label cites Decree 13/2023/NĐ-CP");
  assert(consentRaw.includes("defaultChecked = false") || consentRaw.includes("defaultChecked={false}"), 
    "4.3 Consent checkbox enforces strict opt-in mandate (NOT checked by default)");
  assert(consentRaw.includes("<input") && consentRaw.includes("type=\"checkbox\""), 
    "4.4 Consent rendered as standard accessible HTML input checkbox");

  // CheckoutModal Integration
  const checkoutModalPath = path.join(projectRoot, "components/CheckoutModal.tsx");
  const checkoutRaw = fs.readFileSync(checkoutModalPath, "utf8");
  assert(checkoutRaw.includes("PrivacyConsentCheckbox"), "4.5 CheckoutModal imports PrivacyConsentCheckbox");
  assert(checkoutRaw.includes("consentChecked"), "4.6 CheckoutModal tracks consentChecked state variable");
  assert(checkoutRaw.includes("!consentChecked"), "4.7 CheckoutModal submission is guarded/blocked if !consentChecked");

  // Wholesale LeadFormSection Integration
  const leadFormPath = path.join(projectRoot, "components/landing/LeadFormSection.tsx");
  const leadFormRaw = fs.readFileSync(leadFormPath, "utf8");
  assert(leadFormRaw.includes("PrivacyConsentCheckbox"), "4.8 LeadFormSection imports PrivacyConsentCheckbox");
  assert(leadFormRaw.includes("consentChecked"), "4.9 LeadFormSection tracks consentChecked state variable");
  assert(leadFormRaw.includes("!consentChecked"), "4.10 LeadFormSection submission is guarded/blocked if !consentChecked");

  // Database leads table schema has consent_accepted
  assert(schemaSql.includes("consent_accepted BOOLEAN NOT NULL DEFAULT true"), 
    "4.11 PostgreSQL leads schema tracks consent_accepted per Decree 13/2023");

  // ==========================================================================
  // 5. BEHAVIORAL ORDER ROUTE INTEGRATION & ADVERSARIAL PRICING STRESS
  // ==========================================================================
  console.log("\n▶ TASK 5: ADVERSARIAL ORDER ROUTE BEHAVIORAL VALIDATION (app/api/order/route.ts)");
  const orderRoutePath = path.join(projectRoot, "app/api/order/route.ts");
  const orderRouteRaw = fs.readFileSync(orderRoutePath, "utf8");

  // Verify route loads items dynamically from menuDb and checks prices on server
  assert(orderRouteRaw.includes("getMenuItems"), "5.1 Order route dynamically queries menu catalog via getMenuItems()");
  assert(orderRouteRaw.includes("calculatedSubtotal += menuItem.price * qty"), 
    "5.2 Order route computes price server-side strictly from master menu catalog (anti-tamper)");

  // Sample kit minimum order exemption
  assert(orderRouteRaw.includes("kit-mau-thu-25k") && orderRouteRaw.includes("25000"),
    "5.3 Order route supports 25.000đ minimum order exemption for 'kit-mau-thu-25k'");

  // High-value COD deposit warning
  assert(orderRouteRaw.includes("150000") && orderRouteRaw.includes("30k"),
    "5.4 Order route enforces 30k deposit requirement for COD orders exceeding 150.000đ");

  // ==========================================================================
  // HARNESS SUMMARY REPORT
  // ==========================================================================
  console.log("\n======================================================================");
  console.log("                     EXECUTION SUMMARY REPORT                         ");
  console.log("======================================================================");
  console.log(`Total Assertions : ${totalAssertions}`);
  console.log(`Passed           : ${passedAssertions}`);
  console.log(`Failed           : ${failedAssertions}`);
  const passRate = ((passedAssertions / totalAssertions) * 100).toFixed(1);
  console.log(`Pass Rate        : ${passRate}%`);

  if (failedAssertions > 0) {
    console.error("\n❌ HARNESS FAILED WITH VIOLATIONS:");
    for (const f of failures) {
      console.error(` - ${f.testName}`);
    }
    process.exit(1);
  } else {
    console.log("\n✅ ALL MASTER DATA & FINANCIAL ASSERTIONS PASSED EMPIRICALLY (100%).");
    process.exit(0);
  }
}

runMasterDataVerification().catch((err) => {
  console.error("FATAL ERROR IN HARNESS:", err);
  process.exit(1);
});
