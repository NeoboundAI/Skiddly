import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Agent from "@/models/Agent";
import {
  logApiError,
  logApiSuccess,
  logDbOperation,
  logAuthFailure,
  logBusinessEvent,
} from "@/lib/apiLogger";

export async function PUT(request, { params }) {
  let session;
  let id;
  try {
    // Get user session
    session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logAuthFailure(
        "PUT",
        "/api/agents/[id]/status",
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
        "/api/agents/[id]/status",
        session.user,
        "User not found in database"
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Await params before destructuring
    const resolvedParams = await params;
    id = resolvedParams.id;
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !["active", "inactive", "draft"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'active', 'inactive', or 'draft'" },
        { status: 400 }
      );
    }

    // Find the agent and ensure it belongs to the user
    const agent = await Agent.findOne({
      _id: id,
      userId: user._id,
    });

    if (!agent) {
      logApiError(
        "PUT",
        "/api/agents/[id]/status",
        404,
        new Error("Agent not found"),
        session.user,
        {
          agentId: id,
        }
      );
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const previousStatus = agent.status;

    // Update agent status
    const updatedAgent = await Agent.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    logDbOperation("update", "Agent", session.user, {
      agentId: id,
      operation: "update_agent_status",
      previousStatus,
      newStatus: status,
    });

    logBusinessEvent("agent_status_changed", session.user, {
      agentId: id,
      agentName: agent.name,
      previousStatus,
      newStatus: status,
    });

    logApiSuccess("PUT", "/api/agents/[id]/status", 200, session.user, {
      agentId: id,
      agentName: agent.name,
      previousStatus,
      newStatus: status,
    });

    return NextResponse.json({
      success: true,
      data: updatedAgent,
    });
  } catch (error) {
    logApiError(
      "PUT",
      "/api/agents/[id]/status",
      500,
      error,
      session?.user?.id,
      {
        agentId: id,
      }
    );
    return NextResponse.json(
      { error: "Failed to update agent status" },
      { status: 500 }
    );
  }
}
