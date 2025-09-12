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

export async function GET(request, { params }) {
  let session;
  let id;
  try {
    // Get user session
    session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logAuthFailure(
        "GET",
        "/api/vapi/assistants/[id]",
        null,
        "No session or user email"
      );
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    id = resolvedParams.id;

    // Initialize VAPI client
    const client = new VapiClient({
      token: process.env.VAPI_API_KEY,
    });

    // Fetch assistant from VAPI
    logExternalApi("VAPI", "get_assistant", session.user, {
      assistantId: id,
    });

    const assistant = await client.assistants.get(id);
    console.log("assistant", assistant);

    logApiSuccess("GET", "/api/vapi/assistants/[id]", 200, session.user, {
      assistantId: id,
      assistantName: assistant.name,
    });

    return NextResponse.json({
      success: true,
      data: assistant,
    });
  } catch (error) {
    logExternalApiError("VAPI", "get_assistant", error, session?.user?.email, {
      assistantId: id,
    });

    logApiError("GET", "/api/vapi/assistants/[id]", 500, error, session?.user, {
      assistantId: id,
    });

    return NextResponse.json(
      { error: "Failed to fetch assistant" },
      { status: 500 }
    );
  }
}
