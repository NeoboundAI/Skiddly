import Groq from "groq-sdk";
import OpenAI from "openai";
import { CALL_OUTCOMES_PICKED, FINAL_ACTIONS } from "@/constants/callConstants";

/**
 * Call Analysis Service
 * Handles transcription and AI analysis of call recordings
 */
class CallAnalysisService {
  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * Analyze call recording and transcript
   * @param {Object} callData - Call data from VAPI webhook
   * @param {string} callData.recordingUrl - URL of the call recording
   * @param {string} callData.transcript - VAPI transcript (fallback)
   * @param {string} callData.endedReason - Reason call ended
   * @param {Date} callData.updatedAt - Call end time
   * @returns {Object} Analysis result
   */
  async analyzeCall(callData) {
    try {
      console.log("🔍 Starting call analysis...");

      // Get transcript from recording or use VAPI transcript as fallback
      let transcript = "";
      if (callData.recordingUrl) {
        try {
          console.log("🎵 Transcribing call recording...");
          const transcription = await this.groq.audio.transcriptions.create({
            url: callData.recordingUrl,
            model: "whisper-large-v3",
            response_format: "verbose_json",
            language: "en",
            temperature: 0.0,
          });
          transcript = transcription.text || callData.transcript || "";
          console.log("✅ Transcription completed");
        } catch (transcriptionError) {
          console.error("❌ Transcription failed:", transcriptionError.message);
          transcript = callData.transcript || "";
          console.log("📝 Using VAPI transcript as fallback");
        }
      } else {
        transcript = callData.transcript || "";
        console.log("📝 Using VAPI transcript (no recording URL)");
      }

      if (!transcript || transcript.trim() === "") {
        console.log("⚠️ No transcript available for analysis");
        return this.getDefaultAnalysis(callData.endedReason);
      }

      // Get current time in IST
      const utcDate = new Date(callData.updatedAt || new Date());
      const currentTime = utcDate.toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });

      // Analyze transcript with OpenAI
      console.log("🤖 Analyzing transcript with OpenAI...");
      const analysis = await this.analyzeTranscript(
        transcript,
        callData.endedReason,
        currentTime
      );

      console.log("✅ Call analysis completed");
      return analysis;
    } catch (error) {
      console.error("❌ Error in call analysis:", error.message);
      return this.getDefaultAnalysis(callData.endedReason);
    }
  }

  /**
   * Analyze transcript using OpenAI
   * @param {string} transcript - Call transcript
   * @param {string} endedReason - Reason call ended
   * @param {string} currentTime - Current time in IST
   * @returns {Object} Analysis result
   */
  async analyzeTranscript(transcript, endedReason, currentTime) {
    const prompt = this.buildAnalysisPrompt(
      transcript,
      endedReason,
      currentTime
    );

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert call analyst for e-commerce abandoned cart recovery. Analyze the call transcript and provide structured insights about the customer's response and next actions needed.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      });

      const responseText = response.choices[0]?.message?.content || "";
      return this.parseAnalysisResponse(responseText, endedReason);
    } catch (error) {
      console.error("❌ OpenAI analysis failed:", error.message);
      return this.getDefaultAnalysis(endedReason);
    }
  }

  /**
   * Build the analysis prompt
   * @param {string} transcript - Call transcript
   * @param {string} endedReason - Reason call ended
   * @param {string} currentTime - Current time in IST
   * @returns {string} Formatted prompt
   */
  buildAnalysisPrompt(transcript, endedReason, currentTime) {
    return `You are given a transcript of an abandoned cart recovery call. Analyze the call and determine the customer's response and state.

Current date and time: ${currentTime}
Call ended reason: "${endedReason}"
Transcript: "${transcript}"

Based on the transcript, determine the customer's state and any specific details mentioned.

For call outcomes when customer was reached (picked), use these options:
- customer_busy: Customer said they are busy
- not_interested: Customer is not interested
- wants_discount: Customer wants a discount
- wants_free_shipping: Customer wants free shipping
- reschedule_request: Customer wants to reschedule call
- abusive_language: Customer used abusive language
- do_not_call_request: Customer asked not to call again
- completed_purchase: Customer completed purchase during call
- will_think_about_it: Customer said they will think about it
- technical_issues: Customer had technical issues with website
- wrong_person: Reached wrong person

CRITICAL: Pay special attention to RESCHEDULE REQUESTS. Look for these patterns:
- Specific times: "call me at 3 PM", "call me tomorrow at 2:30", "call me at 4 o'clock"
- Relative times: "call me in 2 hours", "call me later", "call me tomorrow morning"
- Timezone hints: "call me at 3 PM EST", "call me at 2 PM my time", "call me at 5 PM IST"
- Date references: "tomorrow", "next week", "Monday", "this afternoon", "this evening"
- Time periods: "morning", "afternoon", "evening", "night"

For reschedule requests, extract:
- rescheduleRequested: true if customer wants to reschedule
- rescheduleTime: Extract the specific time (e.g., "3:00 PM", "14:30", "2 o'clock")
- rescheduleDate: Extract the date (e.g., "tomorrow", "2024-01-15", "Monday")
- rescheduleTimezone: Extract timezone hints (e.g., "EST", "IST", "my time")
- relativeTime: Extract relative expressions (e.g., "in 2 hours", "tomorrow morning")

Examples of reschedule extraction:
- "Call me at 3 PM tomorrow" → rescheduleTime: "3:00 PM", rescheduleDate: "tomorrow"
- "Call me in 2 hours" → relativeTime: "in 2 hours"
- "Call me at 2 PM EST" → rescheduleTime: "2:00 PM", rescheduleTimezone: "EST"
- "Call me tomorrow morning" → rescheduleDate: "tomorrow", relativeTime: "tomorrow morning"
- "Call me later today" → relativeTime: "later today"

IMPORTANT: Respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or additional text. Just the raw JSON.

{
  "summary": "Complete summary of the call as a string",
  "callOutcome": "one of the call outcome options above",
  "structuredData": {
    "customerName": "customer name if mentioned",
    "customerPhone": "phone number if mentioned",
    "discountRequested": "discount amount or percentage if mentioned",
    "rescheduleRequested": true/false,
    "rescheduleTime": "extract specific time (e.g., '3:00 PM', '14:30', '2 o'clock')",
    "rescheduleDate": "extract date (e.g., 'tomorrow', 'Monday', '2024-01-15')",
    "rescheduleTimezone": "extract timezone hint (e.g., 'EST', 'IST', 'my time')",
    "relativeTime": "extract relative expression (e.g., 'in 2 hours', 'tomorrow morning')",
    "purchaseCompleted": true/false,
    "technicalIssues": "description of technical issues if any",
    "additionalNotes": "any other important details"
  },
  "confidence": 0.0-1.0
}`;
  }

  /**
   * Parse OpenAI response and handle JSON parsing errors
   * @param {string} responseText - Raw response from OpenAI
   * @param {string} endedReason - Reason call ended
   * @returns {Object} Parsed analysis
   */
  parseAnalysisResponse(responseText, endedReason) {
    try {
      // First, try to parse the response as-is
      let parsedResponse = JSON.parse(responseText);
      return this.validateAnalysisResponse(parsedResponse, endedReason);
    } catch (parseError) {
      console.error("❌ Error parsing JSON response:", parseError.message);
      console.error("Raw response text:", responseText);

      // Try to clean up markdown formatting and extract JSON
      let cleanedText = responseText;

      // Remove markdown code blocks (both ```json and ```)
      cleanedText = cleanedText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "");

      // Remove any leading/trailing whitespace
      cleanedText = cleanedText.trim();

      try {
        // Try to parse the cleaned text
        let parsedResponse = JSON.parse(cleanedText);
        return this.validateAnalysisResponse(parsedResponse, endedReason);
      } catch (secondParseError) {
        console.error(
          "❌ Error parsing cleaned JSON response:",
          secondParseError.message
        );

        // Try to extract JSON using regex as a last resort
        try {
          // Look for JSON object between curly braces - use non-greedy match
          const jsonMatch = cleanedText.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            let parsedResponse = JSON.parse(jsonMatch[0]);
            return this.validateAnalysisResponse(parsedResponse, endedReason);
          } else {
            // Try to find the first complete JSON object by counting braces
            const jsonStart = cleanedText.indexOf("{");
            if (jsonStart !== -1) {
              let braceCount = 0;
              let jsonEnd = -1;

              for (let i = jsonStart; i < cleanedText.length; i++) {
                if (cleanedText[i] === "{") braceCount++;
                if (cleanedText[i] === "}") braceCount--;
                if (braceCount === 0) {
                  jsonEnd = i;
                  break;
                }
              }

              if (jsonEnd !== -1) {
                const jsonString = cleanedText.substring(
                  jsonStart,
                  jsonEnd + 1
                );
                let parsedResponse = JSON.parse(jsonString);
                return this.validateAnalysisResponse(
                  parsedResponse,
                  endedReason
                );
              }
            }

            console.error("❌ No valid JSON found in response");
            return this.getDefaultAnalysis(endedReason);
          }
        } catch (fallbackError) {
          console.error(
            "❌ Fallback JSON parsing also failed:",
            fallbackError.message
          );
          return this.getDefaultAnalysis(endedReason);
        }
      }
    }
  }

  /**
   * Validate and clean the analysis response
   * @param {Object} response - Parsed response
   * @param {string} endedReason - Reason call ended
   * @returns {Object} Validated analysis
   */
  validateAnalysisResponse(response, endedReason) {
    // Validate call outcome
    const validOutcomes = Object.values(CALL_OUTCOMES_PICKED);
    if (
      !response.callOutcome ||
      !validOutcomes.includes(response.callOutcome)
    ) {
      response.callOutcome = this.inferCallOutcome(endedReason);
    }

    // Determine final action based on call outcome
    const finalAction = this.determineFinalAction(response.callOutcome);

    // Ensure required fields exist
    return {
      summary: response.summary || "Call analysis completed",
      callOutcome: response.callOutcome,
      finalAction: finalAction,
      structuredData: response.structuredData || {},
      confidence: response.confidence || 0.5,
      analysisMethod: "ai_analysis",
    };
  }

  /**
   * Infer call outcome based on ended reason
   * @param {string} endedReason - Reason call ended
   * @returns {string} Inferred outcome
   */
  inferCallOutcome(endedReason) {
    if (!endedReason) return CALL_OUTCOMES_PICKED.NOT_INTERESTED;

    if (endedReason === "customer-ended-call") {
      return CALL_OUTCOMES_PICKED.NOT_INTERESTED;
    } else if (endedReason === "customer-busy") {
      return CALL_OUTCOMES_PICKED.CUSTOMER_BUSY;
    } else if (endedReason === "customer-did-not-answer") {
      return CALL_OUTCOMES_PICKED.NOT_INTERESTED;
    } else {
      return CALL_OUTCOMES_PICKED.TECHNICAL_ISSUES;
    }
  }

  /**
   * Determine final action based on call outcome
   * @param {string} callOutcome - Call outcome from AI analysis
   * @returns {string} Final action to take
   */
  determineFinalAction(callOutcome) {
    switch (callOutcome) {
      case CALL_OUTCOMES_PICKED.COMPLETED_PURCHASE:
        return FINAL_ACTIONS.ORDER_COMPLETED;

      case CALL_OUTCOMES_PICKED.DO_NOT_CALL_REQUEST:
      case CALL_OUTCOMES_PICKED.ABUSIVE_LANGUAGE:
        return FINAL_ACTIONS.MARKED_DNC;

      case CALL_OUTCOMES_PICKED.RESCHEDULE_REQUEST:
        return FINAL_ACTIONS.RESCHEDULE_CALL;

      case CALL_OUTCOMES_PICKED.WANTS_DISCOUNT:
      case CALL_OUTCOMES_PICKED.WANTS_FREE_SHIPPING:
        return FINAL_ACTIONS.SMS_SENT_WITH_DISCOUNT_CODE;

      case CALL_OUTCOMES_PICKED.CUSTOMER_BUSY:
        return FINAL_ACTIONS.SCHEDULED_RETRY;

      case CALL_OUTCOMES_PICKED.NOT_INTERESTED:
      case CALL_OUTCOMES_PICKED.WILL_THINK_ABOUT_IT:
      case CALL_OUTCOMES_PICKED.TECHNICAL_ISSUES:
      case CALL_OUTCOMES_PICKED.WRONG_PERSON:
      default:
        return FINAL_ACTIONS.NO_ACTION_REQUIRED;
    }
  }

  /**
   * Get default analysis when AI analysis fails
   * @param {string} endedReason - Reason call ended
   * @returns {Object} Default analysis
   */
  getDefaultAnalysis(endedReason) {
    const callOutcome = this.inferCallOutcome(endedReason);
    const finalAction = this.determineFinalAction(callOutcome);

    return {
      summary: `Call ended with reason: ${endedReason}. Analysis could not be completed due to technical issues.`,
      callOutcome: callOutcome,
      finalAction: finalAction,
      structuredData: {},
      confidence: 0.3,
      analysisMethod: "fallback_analysis",
    };
  }
}

export default new CallAnalysisService();
