/**
 * Environment Variables Check Script
 * Verifies that all required environment variables are set for call analysis
 */

function checkEnvironmentVariables() {
  console.log("🔍 Checking environment variables for call analysis...\n");

  const requiredVars = [
    "GROQ_API_KEY",
    "OPENAI_API_KEY",
    "VAPI_WEBHOOK_SECRET",
  ];

  const optionalVars = ["NODE_ENV", "MONGODB_URI"];

  let allRequired = true;

  console.log("Required Environment Variables:");
  console.log("=" * 40);

  requiredVars.forEach((varName) => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
      allRequired = false;
    }
  });

  console.log("\nOptional Environment Variables:");
  console.log("=" * 40);

  optionalVars.forEach((varName) => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value}`);
    } else {
      console.log(`⚠️  ${varName}: NOT SET (optional)`);
    }
  });

  console.log("\n" + "=" * 50);

  if (allRequired) {
    console.log("✅ All required environment variables are set!");
    console.log("🚀 Call analysis service should work correctly.");
  } else {
    console.log("❌ Some required environment variables are missing!");
    console.log("🔧 Please set the missing variables in your .env file.");
    console.log("\nRequired variables:");
    requiredVars.forEach((varName) => {
      if (!process.env[varName]) {
        console.log(`   - ${varName}`);
      }
    });
  }

  return allRequired;
}

// Run the check
checkEnvironmentVariables();
