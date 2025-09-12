import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively find all route.js files
function findRouteFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (
      stat.isDirectory() &&
      !item.startsWith(".") &&
      item !== "node_modules"
    ) {
      findRouteFiles(fullPath, files);
    } else if (item === "route.js") {
      files.push(fullPath);
    }
  }

  return files;
}

// Function to update a single route file
function updateRouteFile(filePath) {
  console.log(`Processing: ${filePath}`);

  let content = fs.readFileSync(filePath, "utf8");
  let updated = false;

  // Patterns to replace for better user identification
  const patterns = [
    // Replace session.user.email with session.user in logging calls
    {
      from: /logAuthFailure\([^,]+,\s*[^,]+,\s*session\.user\.email/g,
      to: (match) => match.replace(/session\.user\.email/g, "session.user"),
    },
    {
      from: /logApiError\([^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*session\.user\.email/g,
      to: (match) => match.replace(/session\.user\.email/g, "session.user"),
    },
    {
      from: /logApiSuccess\([^,]+,\s*[^,]+,\s*[^,]+,\s*session\.user\.email/g,
      to: (match) => match.replace(/session\.user\.email/g, "session.user"),
    },
    {
      from: /logDbOperation\([^,]+,\s*[^,]+,\s*session\.user\.email/g,
      to: (match) => match.replace(/session\.user\.email/g, "session.user"),
    },
    {
      from: /logExternalApi\([^,]+,\s*[^,]+,\s*session\.user\.email/g,
      to: (match) => match.replace(/session\.user\.email/g, "session.user"),
    },
    {
      from: /logExternalApiError\([^,]+,\s*[^,]+,\s*[^,]+,\s*session\.user\.email/g,
      to: (match) => match.replace(/session\.user\.email/g, "session.user"),
    },
    {
      from: /logBusinessEvent\([^,]+,\s*session\.user\.email/g,
      to: (match) => match.replace(/session\.user\.email/g, "session.user"),
    },

    // Replace user._id.toString() with session.user in logging calls
    {
      from: /logDbOperation\([^,]+,\s*[^,]+,\s*user\._id\.toString\(\)/g,
      to: (match) => match.replace(/user\._id\.toString\(\)/g, "session.user"),
    },
    {
      from: /logApiSuccess\([^,]+,\s*[^,]+,\s*[^,]+,\s*user\._id\.toString\(\)/g,
      to: (match) => match.replace(/user\._id\.toString\(\)/g, "session.user"),
    },
    {
      from: /logBusinessEvent\([^,]+,\s*user\._id\.toString\(\)/g,
      to: (match) => match.replace(/user\._id\.toString\(\)/g, "session.user"),
    },

    // Replace session?.user?.email with session?.user in catch blocks
    {
      from: /logApiError\([^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*session\?\.user\?\.email/g,
      to: (match) =>
        match.replace(/session\?\.user\?\.email/g, "session?.user"),
    },

    // Replace user._id.toString() with session.user in specific contexts
    {
      from: /logApiError\([^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*user\._id\.toString\(\)/g,
      to: (match) => match.replace(/user\._id\.toString\(\)/g, "session.user"),
    },
  ];

  // Apply all patterns
  for (const pattern of patterns) {
    if (pattern.from.test(content)) {
      content = content.replace(pattern.from, pattern.to);
      updated = true;
    }
  }

  // Write back if changes were made
  if (updated) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Updated: ${filePath}`);
    return true;
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`);
    return false;
  }
}

// Main execution
function main() {
  const apiDir = path.join(__dirname, "..", "src", "app", "api");

  if (!fs.existsSync(apiDir)) {
    console.error("API directory not found:", apiDir);
    return;
  }

  console.log("🔍 Finding all route.js files...");
  const routeFiles = findRouteFiles(apiDir);

  console.log(`📁 Found ${routeFiles.length} route files`);

  let updatedCount = 0;

  for (const file of routeFiles) {
    if (updateRouteFile(file)) {
      updatedCount++;
    }
  }

  console.log(`\n🎉 Summary:`);
  console.log(`- Total files processed: ${routeFiles.length}`);
  console.log(`- Files updated: ${updatedCount}`);
  console.log(`- Files unchanged: ${routeFiles.length - updatedCount}`);
}

main();
