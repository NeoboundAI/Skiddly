import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { VapiClient } from "@vapi-ai/server-sdk";

export async function GET(request, { params }) {
  try {
    console.log("🔍 GET /api/vapi/assistants/[id] - Starting request");

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

    const { id } = await params;
    console.log("🆔 Fetching assistant with ID:", id);

    // Initialize VAPI client
    console.log("🔧 Initializing VAPI client...");
    const client = new VapiClient({
      token: process.env.VAPI_API_KEY,
    });

    // Fetch assistant from VAPI
    console.log("📡 Making request to VAPI API...");
    const assistant = await client.assistants.get(id);
    console.log("✅ VAPI assistant fetched successfully:", assistant);

    return NextResponse.json({
      success: true,
      data: assistant,
    });
  } catch (error) {
    console.error("Error fetching VAPI assistant:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistant" },
      { status: 500 }
    );
  }
}
