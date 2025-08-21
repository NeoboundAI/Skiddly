import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Agent from "@/models/Agent";
import DefaultAgent from "@/models/DefaultAgent";

export async function POST(request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    // Find user
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { assistantId } = body;

    if (!assistantId) {
      return NextResponse.json(
        { error: "Assistant ID is required" },
        { status: 400 }
      );
    }

    // Find the default agent template
    const defaultAgent = await DefaultAgent.findOne({
      assistantId,
      enabled: true,
    });

    if (!defaultAgent) {
      return NextResponse.json(
        { error: "Default agent template not found" },
        { status: 404 }
      );
    }

    // Fetch VAPI agent configuration from VAPI API
    let vapiConfiguration = null;
    try {
      const vapiResponse = await fetch(
        `https://api.vapi.ai/assistant/${assistantId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (vapiResponse.ok) {
        const vapiAgent = await vapiResponse.json();
        vapiConfiguration = {
          voice: vapiAgent.voice,
          model: {
            model: vapiAgent.model.model,
            provider: vapiAgent.model.provider,
            messages: vapiAgent.model.messages, // Include the messages array
          },
          firstMessage: vapiAgent.firstMessage,
          voicemailMessage: vapiAgent.voicemailMessage,
          endCallMessage: vapiAgent.endCallMessage,
          transcriber: vapiAgent.transcriber,
          isServerUrlSecretSet: vapiAgent.isServerUrlSecretSet,
        };
      } else {
        console.error("Failed to fetch VAPI agent:", vapiResponse.status);
        return NextResponse.json(
          { error: "Failed to fetch VAPI agent configuration" },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error("Error fetching VAPI agent:", error);
      return NextResponse.json(
        { error: "Failed to fetch VAPI agent configuration" },
        { status: 500 }
      );
    }

    // Create new agent from template
    const agent = new Agent({
      userId: user._id,
      assistantId: defaultAgent.assistantId,
      name: defaultAgent.name,
      type: defaultAgent.type,
      status: "draft", // Start as draft
      configuration: {
        ...defaultAgent.defaultConfiguration,
        // Add any user-specific overrides here if needed
      },
      vapiConfiguration: vapiConfiguration, // Store the fetched VAPI configuration
    });

    await agent.save();

    return NextResponse.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    console.error("Error creating agent from template:", error);
    return NextResponse.json(
      { error: "Failed to create agent from template" },
      { status: 500 }
    );
  }
}
