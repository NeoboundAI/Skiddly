import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { VapiClient } from "@vapi-ai/server-sdk";

export async function POST(request) {
  try {
    console.log("🔧 POST /api/vapi/assistants - Starting request");

    // Get user session
    const session = await getServerSession(authOptions);
    console.log(
      "👤 User session:",
      session?.user?.email ? "Authenticated" : "Not authenticated"
    );

    if (!session?.user?.email) {
      console.log("❌ Authentication failed");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("📋 Request body received:", body);

    // Clean the body to remove properties that shouldn't exist when creating
    const cleanBody = {
      name: body.name,
      model: body.model,
      voice: body.voice,
      firstMessage: body.firstMessage,
      // Add other valid properties as needed
    };
    console.log("🧹 Cleaned body for VAPI:", cleanBody);

    // Initialize VAPI client
    console.log("🔧 Initializing VAPI client...");
    const client = new VapiClient({
      token: process.env.VAPI_API_KEY,
    });

    // Create assistant in VAPI
    console.log("📡 Making request to VAPI API to create assistant...");
    const assistant = await client.assistants.create(cleanBody);
    console.log("✅ VAPI assistant created successfully:", assistant);

    return NextResponse.json({
      success: true,
      data: assistant,
    });
  } catch (error) {
    console.error("Error creating VAPI assistant:", error);
    return NextResponse.json(
      { error: "Failed to create assistant" },
      { status: 500 }
    );
  }
}
