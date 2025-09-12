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
        "/api/agents/[id]",
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
        "GET",
        "/api/agents/[id]",
        session.user,
        "User not found in database"
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Await params before destructuring
    const resolvedParams = await params;
    id = resolvedParams.id;

    // Find the agent and ensure it belongs to the user
    const agent = await Agent.findOne({
      _id: id,
      userId: user._id,
    }).populate("shopifyShopId");

    if (!agent) {
      logApiError(
        "GET",
        "/api/agents/[id]",
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
      operation: "fetch_single_agent",
    });

    logApiSuccess("GET", "/api/agents/[id]", 200, session.user, {
      agentId: id,
      agentName: agent.name,
    });

    return NextResponse.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    logApiError("GET", "/api/agents/[id]", 500, error, session?.user, {
      agentId: id,
    });
    return NextResponse.json(
      { error: "Failed to fetch agent" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  let session;
  let id;
  try {
    // Get user session
    session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logAuthFailure(
        "PUT",
        "/api/agents/[id]",
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
        "/api/agents/[id]",
        session.user,
        "User not found in database"
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Await params before destructuring
    const resolvedParams = await params;
    id = resolvedParams.id;
    const body = await request.json();

    // Find the agent and ensure it belongs to the user
    const agent = await Agent.findOne({
      _id: id,
      userId: user._id,
    });

    if (!agent) {
      logApiError(
        "PUT",
        "/api/agents/[id]",
        404,
        new Error("Agent not found"),
        session.user,
        {
          agentId: id,
        }
      );
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Update agent with provided data
    const updatedAgent = await Agent.findByIdAndUpdate(id, body, {
      new: true,
    }).populate("shopifyShopId");

    logDbOperation("update", "Agent", session.user, {
      agentId: id,
      operation: "update_agent",
      updatedFields: Object.keys(body),
    });

    logApiSuccess("PUT", "/api/agents/[id]", 200, session.user, {
      agentId: id,
      agentName: updatedAgent.name,
    });

    return NextResponse.json({
      success: true,
      data: updatedAgent,
    });
  } catch (error) {
    logApiError("PUT", "/api/agents/[id]", 500, error, session?.user, {
      agentId: id,
    });
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 }
    );
  }
}
