import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Agent from "@/models/Agent";
import DefaultAgent from "@/models/DefaultAgent";
import {
  logApiError,
  logApiSuccess,
  logAuthFailure,
  logDbOperation,
  logExternalApi,
  logExternalApiError,
  logBusinessEvent,
} from "@/lib/apiLogger";

export async function POST(request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logAuthFailure(
        "POST",
        "/api/agents/create-from-template",
        null,
        "No session or user email"
      );
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    // Find user
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      logAuthFailure(
        "POST",
        "/api/agents/create-from-template",
        session.user,
        "User not found in database"
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { assistantId } = body;

    if (!assistantId) {
      logApiError(
        "POST",
        "/api/agents/create-from-template",
        400,
        new Error("Assistant ID is required"),
        session.user
      );
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
      logApiError(
        "POST",
        "/api/agents/create-from-template",
        404,
        new Error("Default agent template not found"),
        session.user,
        {
          assistantId,
        }
      );
      return NextResponse.json(
        { error: "Default agent template not found" },
        { status: 404 }
      );
    }

    logDbOperation("read", "DefaultAgent", session.user, {
      assistantId,
      templateName: defaultAgent.name,
      templateType: defaultAgent.type,
    });

    // Fetch VAPI agent configuration from VAPI API
    let vapiConfiguration = null;
    try {
      logExternalApi(
        "VAPI",
        "fetch_assistant_configuration",
        user._id.toString(),
        {
          assistantId,
        }
      );

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

        logBusinessEvent(
          "vapi_assistant_configuration_fetched",
          session.user,
          {
            assistantId,
            voice: vapiAgent.voice,
            model: vapiAgent.model.model,
          }
        );
      } else {
        logExternalApiError(
          "VAPI",
          "fetch_assistant_configuration",
          new Error(`Failed to fetch VAPI agent: ${vapiResponse.status}`),
          user._id.toString(),
          {
            assistantId,
            status: vapiResponse.status,
          }
        );
        return NextResponse.json(
          { error: "Failed to fetch VAPI agent configuration" },
          { status: 500 }
        );
      }
    } catch (error) {
      logExternalApiError(
        "VAPI",
        "fetch_assistant_configuration",
        error,
        user._id.toString(),
        {
          assistantId,
        }
      );
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

    logDbOperation("create", "Agent", session.user, {
      agentId: agent._id.toString(),
      assistantId: defaultAgent.assistantId,
      name: defaultAgent.name,
      type: defaultAgent.type,
      status: "draft",
    });

    logBusinessEvent("agent_created_from_template", session.user, {
      agentId: agent._id.toString(),
      templateName: defaultAgent.name,
      templateType: defaultAgent.type,
      assistantId: defaultAgent.assistantId,
    });

    logApiSuccess(
      "POST",
      "/api/agents/create-from-template",
      200,
      session.user,
      {
        agentId: agent._id.toString(),
        name: defaultAgent.name,
        type: defaultAgent.type,
      }
    );

    return NextResponse.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    logApiError(
      "POST",
      "/api/agents/create-from-template",
      500,
      error,
      session?.user?.id,
      {
        assistantId: request.body?.assistantId,
      }
    );
    return NextResponse.json(
      { error: "Failed to create agent from template" },
      { status: 500 }
    );
  }
}
