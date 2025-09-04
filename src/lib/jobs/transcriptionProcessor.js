import { agenda } from "../agenda.js";
import AbandonedCart from "../../models/AbandonedCart.js";
import { logBusinessEvent, logApiError, logExternalApi } from "../apiLogger.js";
// import OpenAI from "openai"; // You'll need to install this

// Mock OpenAI client for now
const mockOpenAIClient = {
  audio: {
    transcriptions: {
      async create(options) {
        return {
          text: "Mock transcription: Customer discussed cart items and showed interest in completing purchase.",
        };
      },
    },
  },
  chat: {
    completions: {
      async create(options) {
        return {
          choices: [
            {
              message: {
                content:
                  "Customer showed interest in the products but was concerned about shipping costs. They indicated they might complete the purchase if free shipping was offered.",
              },
            },
          ],
        };
      },
    },
  },
};

// Job: Transcribe and summarize call recording
agenda.define("transcribe-call", async (job) => {
  const { abandonedCartId, attemptNumber, recordingUrl, correlationId } =
    job.attrs.data;

  try {
    logBusinessEvent("job_started", correlationId, {
      jobType: "transcribe-call",
      abandonedCartId,
      attemptNumber,
    });

    // Find the abandoned cart
    const abandonedCart = await AbandonedCart.findById(abandonedCartId);
    if (!abandonedCart) {
      throw new Error("Abandoned cart not found");
    }

    // Find the specific call attempt
    const callAttempt = abandonedCart.callAttempts.find(
      (attempt) => attempt.attemptNumber === attemptNumber
    );

    if (!callAttempt) {
      throw new Error(`Call attempt ${attemptNumber} not found`);
    }

    // Skip if already transcribed
    if (callAttempt.transcription) {
      logBusinessEvent("already_transcribed", correlationId, {
        attemptNumber,
        abandonedCartId,
      });
      return;
    }

    logExternalApi("OPENAI", "transcribe_audio", correlationId, {
      recordingUrl,
      attemptNumber,
    });

    // Transcribe using OpenAI Whisper
    const transcriptionResponse =
      await mockOpenAIClient.audio.transcriptions.create({
        file: await fetch(recordingUrl),
        model: "whisper-1",
        language: "en",
      });

    const transcription = transcriptionResponse.text;

    logExternalApi("OPENAI", "create_summary", correlationId, {
      transcriptionLength: transcription.length,
      attemptNumber,
    });

    // Generate summary using GPT
    const summaryResponse = await mockOpenAIClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are analyzing a customer service call about an abandoned shopping cart. Provide a concise summary focusing on: 1) Customer's main concerns or objections, 2) Their likelihood to purchase, 3) Any specific requests or preferences mentioned, 4) Recommended follow-up actions. Keep it under 200 words.",
        },
        {
          role: "user",
          content: `Please summarize this call transcription: ${transcription}`,
        },
      ],
      max_tokens: 250,
      temperature: 0.3,
    });

    const summary = summaryResponse.choices[0].message.content;

    // Update call attempt with transcription and summary
    await abandonedCart.updateCallAttempt(attemptNumber, {
      transcription,
      summary,
    });

    logBusinessEvent("transcription_completed", correlationId, {
      abandonedCartId,
      attemptNumber,
      transcriptionLength: transcription.length,
      summaryLength: summary.length,
    });

    logBusinessEvent("job_completed", correlationId, {
      jobType: "transcribe-call",
      abandonedCartId,
      attemptNumber,
    });
  } catch (error) {
    logApiError("JOB", "transcribe-call", 500, error, correlationId, {
      abandonedCartId,
      attemptNumber,
      recordingUrl,
    });
    throw error;
  }
});
