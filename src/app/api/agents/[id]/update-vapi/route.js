import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Agent from "@/models/Agent";
import {
  logApiError,
  logApiSuccess,
  logAuthFailure,
  logDbOperation,
  logBusinessEvent,
} from "@/lib/apiLogger";

export async function PUT(request, { params }) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logAuthFailure(
        "PUT",
        "/api/agents/[id]/update-vapi",
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
        "PUT",
        "/api/agents/[id]/update-vapi",
        session.user,
        "User not found in database"
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Await params before destructuring
    const { id } = await params;
    const body = await request.json();
    const { configuration, vapiConfiguration, vapiAgentId, shopifyShopId } =
      body;

    // Find the agent and ensure it belongs to the user
    const agent = await Agent.findOne({
      _id: id,
      userId: user._id,
    });

    if (!agent) {
      logApiError(
        "PUT",
        "/api/agents/[id]/update-vapi",
        404,
        new Error("Agent not found"),
        session.user,
        {
          agentId: id,
        }
      );
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    logDbOperation("read", "Agent", session.user, {
      agentId: id,
      operation: "find_agent_for_vapi_update",
    });

    // Update agent with new configuration and VAPI agent ID
    const updatedAgent = await Agent.findByIdAndUpdate(
      id,
      {
        configuration,
        vapiConfiguration,
        vapiAgentId, // This will be set when VAPI agent is created
        shopifyShopId,
        status: "active", // Mark as active once VAPI agent is created
      },
      { new: true }
    );

    logDbOperation("update", "Agent", session.user, {
      agentId: id,
      operation: "update_vapi_configuration",
      previousStatus: agent.status,
      newStatus: "active",
      hasVapiAgentId: !!vapiAgentId,
      hasShopifyShopId: !!shopifyShopId,
    });

    logBusinessEvent("agent_vapi_updated", session.user, {
      agentId: id,
      agentName: agent.name,
      vapiAgentId,
      shopifyShopId,
      status: "active",
    });

    logApiSuccess(
      "PUT",
      "/api/agents/[id]/update-vapi",
      200,
      session.user,
      {
        agentId: id,
        agentName: agent.name,
        vapiAgentId,
        status: "active",
      }
    );

    return NextResponse.json({
      success: true,
      data: updatedAgent,
    });
  } catch (error) {
    logApiError(
      "PUT",
      "/api/agents/[id]/update-vapi",
      500,
      error,
      session?.user?.id,
      {
        agentId: params?.id,
      }
    );
    return NextResponse.json(
      { error: "Failed to update agent with VAPI configuration" },
      { status: 500 }
    );
  }
}
