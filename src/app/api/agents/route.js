import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Agent from "@/models/Agent";
import {
  logApiError,
  logApiSuccess,
  logDbOperation,
  logAuthFailure,
} from "@/lib/apiLogger";

export async function POST(request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logAuthFailure("POST", "/api/agents", null, "No session or user email");
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
        "/api/agents",
        session.user,
        "User not found in database"
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      vapiAgentId,
      name,
      type,
      storeProfile,
      commerceSettings,
      callLogic,
      offerEngine,
      agentPersona,
      objectionHandling,
      testLaunch,
      shopifyShopId,
    } = body;

    // Create new agent with 7-step wizard structure
    const agent = new Agent({
      userId: user._id,
      vapiAgentId,
      name,
      type,
      storeProfile,
      commerceSettings,
      callLogic,
      offerEngine,
      agentPersona,
      objectionHandling,
      testLaunch,
      shopifyShopId,
    });

    await agent.save();

    logDbOperation("create", "Agent", session.user, {
      agentId: agent._id.toString(),
      name,
      type,
      vapiAgentId,
      shopifyShopId,
    });

    logApiSuccess("POST", "/api/agents", 200, session.user, {
      agentId: agent._id.toString(),
      name,
      type,
    });

    return NextResponse.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    logApiError("POST", "/api/agents", 500, error, session?.user);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logAuthFailure("GET", "/api/agents", null, "No session or user email");
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
        "/api/agents",
        session.user,
        "User not found in database"
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");

    // Build query filter
    const filter = { userId: user._id };
    if (shopId) {
      filter.shopifyShopId = shopId;
    }

    // Get agents for this user, optionally filtered by shop
    const agents = await Agent.find(filter).populate("shopifyShopId");

    logDbOperation("read", "Agent", session.user, {
      count: agents.length,
      shopId: shopId || "all",
    });

    logApiSuccess("GET", "/api/agents", 200, session.user, {
      agentCount: agents.length,
      shopId: shopId || "all",
    });

    return NextResponse.json({
      success: true,
      data: agents,
    });
  } catch (error) {
    logApiError("GET", "/api/agents", 500, error, session?.user);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}
