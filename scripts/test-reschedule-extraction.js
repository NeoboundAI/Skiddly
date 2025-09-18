/**
 * Test script for reschedule time extraction
 */

import callAnalysisService from "../src/services/callAnalysisService.js";

// Test cases for reschedule extraction
const testCases = [
  {
    name: "Specific time tomorrow",
    transcript: "Hi, I'm busy right now. Can you call me tomorrow at 3 PM?",
    expected: {
      callOutcome: "reschedule_request",
      rescheduleRequested: true,
      rescheduleTime: "3:00 PM",
      rescheduleDate: "tomorrow",
    },
  },
  {
    name: "Relative time",
    transcript: "I'm in a meeting. Can you call me back in 2 hours?",
    expected: {
      callOutcome: "reschedule_request",
      rescheduleRequested: true,
      relativeTime: "in 2 hours",
    },
  },
  {
    name: "Timezone specific",
    transcript: "Call me at 2 PM EST tomorrow",
    expected: {
      callOutcome: "reschedule_request",
      rescheduleRequested: true,
      rescheduleTime: "2:00 PM",
      rescheduleTimezone: "EST",
      rescheduleDate: "tomorrow",
    },
  },
  {
    name: "Morning request",
    transcript: "I'm not available now. Call me tomorrow morning.",
    expected: {
      callOutcome: "reschedule_request",
      rescheduleRequested: true,
      rescheduleDate: "tomorrow",
      relativeTime: "tomorrow morning",
    },
  },
  {
    name: "Later today",
    transcript: "I'm busy. Call me later today.",
    expected: {
      callOutcome: "reschedule_request",
      rescheduleRequested: true,
      relativeTime: "later today",
    },
  },
  {
    name: "Not interested",
    transcript:
      "I'm not interested in this product. Please don't call me again.",
    expected: {
      callOutcome: "not_interested",
      rescheduleRequested: false,
    },
  },
];

async function testRescheduleExtraction() {
  console.log("🧪 Testing reschedule time extraction...\n");

  for (const testCase of testCases) {
    console.log(`📝 Test: ${testCase.name}`);
    console.log(`Transcript: "${testCase.transcript}"`);

    try {
      // Test the AI analysis
      const result = await callAnalysisService.analyzeCall(
        testCase.transcript,
        "customer-ended-call"
      );

      console.log("✅ Analysis Result:");
      console.log(`  Call Outcome: ${result.callOutcome}`);
      console.log(
        `  Reschedule Requested: ${result.structuredData?.rescheduleRequested}`
      );
      console.log(
        `  Reschedule Time: ${result.structuredData?.rescheduleTime || "N/A"}`
      );
      console.log(
        `  Reschedule Date: ${result.structuredData?.rescheduleDate || "N/A"}`
      );
      console.log(
        `  Reschedule Timezone: ${
          result.structuredData?.rescheduleTimezone || "N/A"
        }`
      );
      console.log(
        `  Relative Time: ${result.structuredData?.relativeTime || "N/A"}`
      );
      console.log(`  Confidence: ${result.confidence}`);

      // Check if expected outcome matches
      const outcomeMatch = result.callOutcome === testCase.expected.callOutcome;
      const rescheduleMatch =
        result.structuredData?.rescheduleRequested ===
        testCase.expected.rescheduleRequested;

      if (outcomeMatch && rescheduleMatch) {
        console.log("✅ Test PASSED");
      } else {
        console.log("❌ Test FAILED");
        console.log(
          `  Expected outcome: ${testCase.expected.callOutcome}, got: ${result.callOutcome}`
        );
        console.log(
          `  Expected reschedule: ${testCase.expected.rescheduleRequested}, got: ${result.structuredData?.rescheduleRequested}`
        );
      }
    } catch (error) {
      console.error("❌ Test failed with error:", error.message);
    }

    console.log("\n" + "=".repeat(50) + "\n");
  }
}

// Run the tests
testRescheduleExtraction();
