/**
 * Debug script to check why a specific cart wasn't processed
 */

import connectDB from "../src/lib/mongodb.js";
import Cart from "../src/models/Cart.js";
import AbandonedCart from "../src/models/AbandonedCart.js";
import Agent from "../src/models/Agent.js";

const SHOPIFY_CHECKOUT_ID = "37190767378691";

async function debugCart() {
  try {
    await connectDB();
    console.log("🔍 Debugging cart:", SHOPIFY_CHECKOUT_ID);

    // 1. Find the cart
    const cart = await Cart.findOne({ shopifyCheckoutId: SHOPIFY_CHECKOUT_ID });
    if (!cart) {
      console.log("❌ Cart not found");
      return;
    }

    console.log("\n📊 Cart Details:");
    console.log("- Status:", cart.status);
    console.log("- Total Price:", cart.totalPrice, cart.currency);
    console.log("- Customer Email:", cart.customerEmail || "❌ NULL");
    console.log("- Customer Phone:", cart.customerPhone || "❌ NULL");
    console.log("- Shipping Phone:", cart.shippingAddress?.phone || "❌ NULL");
    console.log("- Last Activity:", cart.lastActivityAt);
    console.log("- Created:", cart.createdAt);
    console.log("- Updated:", cart.updatedAt);

    // 2. Check qualification
    const cartValue = parseFloat(cart.totalPrice);
    const hasPhone = !!(cart.customerPhone || cart.shippingAddress?.phone);
    const valueQualified = cartValue >= 50; // $50 threshold
    const overallQualified = valueQualified && hasPhone;

    console.log("\n🎯 Qualification Check:");
    console.log("- Cart Value (₹):", cartValue);
    console.log(
      "- Value Qualified (≥$50):",
      valueQualified,
      valueQualified ? "✅" : "❌"
    );
    console.log("- Has Phone:", hasPhone, hasPhone ? "✅" : "❌");
    console.log(
      "- Overall Qualified:",
      overallQualified,
      overallQualified ? "✅" : "❌"
    );

    // 3. Check if abandoned cart record exists
    const abandonedCart = await AbandonedCart.findOne({
      shopifyCheckoutId: SHOPIFY_CHECKOUT_ID,
    });

    console.log("\n🛒 Abandoned Cart Record:");
    if (abandonedCart) {
      console.log("- Exists: ✅");
      console.log("- ID:", abandonedCart._id);
      console.log("- Is Active:", abandonedCart.isActive);
      console.log(
        "- Qualified:",
        abandonedCart.qualificationChecks.overallQualified
      );
      console.log("- Abandoned At:", abandonedCart.abandonedAt);
      console.log("- Created At:", abandonedCart.createdAt);
    } else {
      console.log("- Exists: ❌ No abandoned cart record found");
    }

    // 4. Check for active agent
    const agent = await Agent.findOne({
      userId: cart.userId,
      type: "abandoned-cart",
      status: "active",
    });

    console.log("\n🤖 Agent Check:");
    if (agent) {
      console.log("- Active Agent: ✅");
      console.log("- Agent ID:", agent._id);
      console.log("- Agent Name:", agent.name || "Unnamed");
    } else {
      console.log("- Active Agent: ❌ No active abandoned cart agent found");
    }

    // 5. Time analysis
    const now = new Date();
    const timeSinceUpdate = now - cart.lastActivityAt;
    const minutesSinceUpdate = Math.floor(timeSinceUpdate / (1000 * 60));

    console.log("\n⏰ Timing Analysis:");
    console.log("- Minutes since last activity:", minutesSinceUpdate);
    console.log(
      "- Should be processed (>1 min):",
      minutesSinceUpdate > 1 ? "✅" : "❌"
    );

    // 6. Summary and recommendations
    console.log("\n📋 Summary:");
    if (cart.status === "abandoned") {
      console.log("✅ Cart has already been processed by scanner");
      if (!abandonedCart) {
        console.log(
          "⚠️ BUT no AbandonedCart record found - this indicates an issue!"
        );
      } else if (!abandonedCart.qualificationChecks.overallQualified) {
        console.log("ℹ️ Cart was processed but didn't qualify for calls");
        console.log("   Reasons:");
        if (!valueQualified)
          console.log("   - Cart value too low (₹" + cartValue + " < $50)");
        if (!hasPhone) console.log("   - No phone number available");
      }
    } else if (cart.status === "inCheckout" && minutesSinceUpdate > 1) {
      console.log("⚠️ Cart should be processed by scanner");
    } else {
      console.log("ℹ️ Cart is not ready for abandonment processing yet");
    }
  } catch (error) {
    console.error("❌ Error debugging cart:", error);
  }

  process.exit(0);
}

debugCart();
