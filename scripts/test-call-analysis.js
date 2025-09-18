/**
 * Test script for call analysis service
 * This script tests the AI call analysis functionality with sample data
 */

import callAnalysisService from "../src/services/callAnalysisService.js";

// Sample call data for testing
const sampleCallData = {
  recordingUrl: null, // No recording URL for this test
  transcript: `Agent: Hello, this is Sarah from Skiddly. I'm calling about your recent cart abandonment. I noticed you were interested in our premium plan but didn't complete the purchase. Is there anything I can help you with?

Customer: Oh hi, yes I was looking at that but I'm not sure if it's worth the price. Do you have any discounts available?

Agent: I understand your concern about the price. We do have a special offer for new customers - 20% off your first month. Would that help make the decision easier?

Customer: That sounds good, but I'm really busy right now. Can you call me back later this evening around 7 PM?

Agent: Absolutely! I'll make a note to call you back at 7 PM today. Is this the best number to reach you at?

Customer: Yes, this is fine. Thanks for the discount offer.

Agent: Perfect! I'll call you back at 7 PM with the discount code. Have a great day!

Customer: You too, bye!`,
  endedReason: "customer-ended-call",
  updatedAt: new Date(),
};

const sampleCallData2 = {
  recordingUrl: null,
  transcript: `Agent: Hello, this is Mike from Skiddly. I'm calling about your recent cart abandonment. I noticed you were interested in our basic plan.

Customer: I'm not interested. Please don't call me again.

Agent: I understand. I'll make sure to remove you from our calling list. Have a good day.

Customer: Thank you.`,
  endedReason: "customer-ended-call",
  updatedAt: new Date(),
};

const sampleCallData3 = {
  recordingUrl: null,
  transcript: `Agent: Hello, this is Lisa from Skiddly. I'm calling about your recent cart abandonment.

Customer: I'm sorry, I'm in a meeting right now. Can you call me back in an hour?

Agent: Of course! I'll call you back in an hour. Is this the best number to reach you?

Customer: Yes, that's fine. Thanks.

Agent: Perfect! I'll call you back in an hour. Have a good meeting!`,
  endedReason: "customer-ended-call",
  updatedAt: new Date(),
};

async function testCallAnalysis() {
  console.log("🧪 Testing Call Analysis Service...\n");

  try {
    // Test 1: Customer interested with discount request and reschedule
    console.log(
      "📞 Test 1: Customer interested with discount request and reschedule"
    );
    console.log("=" * 60);
    const result1 = await callAnalysisService.analyzeCall(sampleCallData);
    console.log("Result:", JSON.stringify(result1, null, 2));
    console.log("\n");

    // Test 2: Customer not interested and DNC request
    console.log("📞 Test 2: Customer not interested and DNC request");
    console.log("=" * 60);
    const result2 = await callAnalysisService.analyzeCall(sampleCallData2);
    console.log("Result:", JSON.stringify(result2, null, 2));
    console.log("\n");

    // Test 3: Customer busy and wants callback
    console.log("📞 Test 3: Customer busy and wants callback");
    console.log("=" * 60);
    const result3 = await callAnalysisService.analyzeCall(sampleCallData3);
    console.log("Result:", JSON.stringify(result3, null, 2));
    console.log("\n");

    console.log("✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Error details:", error);
  }
}

// Run the test
testCallAnalysis();
