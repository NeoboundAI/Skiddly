import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { VapiClient } from "@vapi-ai/server-sdk";
import {
  logApiError,
  logApiSuccess,
  logAuthFailure,
  logExternalApi,
  logExternalApiError,
} from "@/lib/apiLogger";

export async function POST(request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logAuthFailure(
        "POST",
        "/api/vapi/assistants",
        null,
        "No session or user email"
      );
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Clean the body to remove properties that shouldn't exist when creating
    const cleanBody = {
      name: body.name,
      model: body.model,
      voice: body.voice,
      firstMessage: body.firstMessage,
      // Add other valid properties as needed
    };

    // Initialize VAPI client
    const client = new VapiClient({
      token: process.env.VAPI_API_KEY,
    });

    // Create assistant in VAPI
    logExternalApi("VAPI", "create_assistant", session.user, {
      assistantName: cleanBody.name,
      model: cleanBody.model,
      voice: cleanBody.voice,
    });

    const assistant = await client.assistants.create(cleanBody);

    logApiSuccess("POST", "/api/vapi/assistants", 200, session.user, {
      assistantId: assistant.id,
      assistantName: cleanBody.name,
    });

    return NextResponse.json({
      success: true,
      data: assistant,
    });
  } catch (error) {
    logExternalApiError(
      "VAPI",
      "create_assistant",
      error,
      session?.user?.email,
      {
        assistantName: body?.name,
      }
    );

    logApiError("POST", "/api/vapi/assistants", 500, error, session?.user, {
      assistantName: body?.name,
    });

    return NextResponse.json(
      { error: "Failed to create assistant" },
      { status: 500 }
    );
  }
}
