#!/usr/bin/env node

/**
 * Script to help identify API routes that need logging implementation
 * Run this script to see which routes still need logging added
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_DIR = path.join(__dirname, "../src/app/api");

// Routes that already have logging implemented
const COMPLETED_ROUTES = [
  "auth/register/route.js",
  "auth/verify-otp/route.js",
  "agents/route.js",
  "shopify/connect/route.js",
  "shopify/webhooks/route.js",
  "twilio/numbers/route.js",
  "twilio/purchase/route.js",
  "vapi/assistants/route.js",
  "admin/logs/route.js",
];

// Routes that need logging implementation
const ROUTES_NEEDING_LOGGING = [
  "auth/forgot-password/route.js",
  "auth/reset-password/route.js",
  "auth/resend-otp/route.js",
  "auth/check-email/route.js",
  "auth/complete-onboarding/route.js",
  "auth/update-plan/route.js",
  "agents/[id]/route.js",
  "agents/default/route.js",
  "agents/create-from-template/route.js",
  "agents/[id]/update-vapi/route.js",
  "shopify/callback/route.js",
  "shopify/shops/route.js",
  "shopify/abandoned-carts/route.js",
  "shopify/register-webhooks/route.js",
  "shopify/remove-webhooks/route.js",
  "twilio/free-numbers/route.js",
  "twilio/assign-free-number/route.js",
  "twilio/import/route.js",
  "vapi/assistants/[id]/route.js",
  "handlers/twilio.js",
];

function findApiRoutes(dir, basePath = "") {
  const routes = [];

  if (!fs.existsSync(dir)) {
    return routes;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.join(basePath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      routes.push(...findApiRoutes(fullPath, relativePath));
    } else if (item === "route.js" || item === "route.ts") {
      routes.push(relativePath);
    }
  }

  return routes;
}

function checkRouteForConsoleLogs(routePath) {
  const fullPath = path.join(API_DIR, routePath);

  if (!fs.existsSync(fullPath)) {
    return { exists: false, hasConsoleLogs: false, hasLoggerImport: false };
  }

  const content = fs.readFileSync(fullPath, "utf8");
  const hasConsoleLogs = /console\.(log|error|warn)/.test(content);
  const hasLoggerImport = /import.*logger.*from.*apiLogger/.test(content);

  return { exists: true, hasConsoleLogs, hasLoggerImport };
}

function main() {
  console.log("🔍 Scanning API routes for logging implementation...\n");

  const allRoutes = findApiRoutes(API_DIR);

  console.log("📋 All API Routes Found:");
  allRoutes.forEach((route) => {
    console.log(`  - ${route}`);
  });

  console.log("\n✅ Routes with Logging Implemented:");
  COMPLETED_ROUTES.forEach((route) => {
    console.log(`  - ${route}`);
  });

  console.log("\n❌ Routes Needing Logging Implementation:");
  ROUTES_NEEDING_LOGGING.forEach((route) => {
    const status = checkRouteForConsoleLogs(route);
    if (status.exists) {
      const consoleStatus = status.hasConsoleLogs
        ? "🔴 Has console.log"
        : "🟢 No console.log";
      const loggerStatus = status.hasLoggerImport
        ? "✅ Has logger import"
        : "❌ No logger import";
      console.log(`  - ${route} - ${consoleStatus} - ${loggerStatus}`);
    } else {
      console.log(`  - ${route} - ⚠️  File not found`);
    }
  });

  console.log("\n📊 Summary:");
  console.log(`  Total routes found: ${allRoutes.length}`);
  console.log(`  Routes with logging: ${COMPLETED_ROUTES.length}`);
  console.log(`  Routes needing logging: ${ROUTES_NEEDING_LOGGING.length}`);

  console.log("\n🚀 Next Steps:");
  console.log("  1. Implement logging in the routes marked as needing it");
  console.log(
    "  2. Replace console.log/console.error with appropriate logger functions"
  );
  console.log("  3. Test the logging system");
  console.log("  4. Check the logs/ directory for log files");
}

main();
