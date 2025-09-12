/**
 * Quick script to check if an AbandonedCart record exists for the given cart
 */

import connectDB from "../src/lib/mongodb.js";
import AbandonedCart from "../src/models/AbandonedCart.js";
import Agent from "../src/models/Agent.js";

const SHOPIFY_CHECKOUT_ID = "37190767378691";
const USER_ID = "68c0f27778c48da9a841e2b8";

async function checkAbandonedCart() {
  try {
    await connectDB();

    console.log("🔍 Checking for AbandonedCart record...");

    // Check if abandoned cart record exists
    const abandonedCart = await AbandonedCart.findOne({
      shopifyCheckoutId: SHOPIFY_CHECKOUT_ID,
    });

    if (abandonedCart) {
      console.log("✅ AbandonedCart record found:");
      console.log("- ID:", abandonedCart._id);
      console.log("- Is Active:", abandonedCart.isActive);
      console.log(
        "- Overall Qualified:",
        abandonedCart.qualificationChecks.overallQualified
      );
      console.log("- Created:", abandonedCart.createdAt);
    } else {
      console.log("❌ No AbandonedCart record found");

      // Check if there's an active agent for this user
      const agent = await Agent.findOne({
        userId: USER_ID,
        type: "abandoned-cart",
        status: "active",
      });

      if (agent) {
        console.log("✅ Active abandoned cart agent found for user");
      } else {
        console.log("❌ No active abandoned cart agent found for user");
        console.log(
          "   This is likely why no AbandonedCart record was created"
        );
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }

  process.exit(0);
}

checkAbandonedCart();
