import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import DefaultAgent from "@/models/DefaultAgent";
import {
  logApiError,
  logApiSuccess,
  logAuthFailure,
  logDbOperation,
} from "@/lib/apiLogger";

export async function GET(request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logAuthFailure(
        "GET",
        "/api/agents/default",
        null,
        "No session or user email"
      );
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    // Get all enabled default agents
    const defaultAgents = await DefaultAgent.find({ enabled: true }).select(
      "name description type category languages enabled assistantId"
    );

    logDbOperation("read", "DefaultAgent", session.user, {
      count: defaultAgents.length,
      filter: "enabled only",
    });

    logApiSuccess("GET", "/api/agents/default", 200, session.user, {
      agentCount: defaultAgents.length,
    });

    return NextResponse.json({
      success: true,
      data: defaultAgents,
    });
  } catch (error) {
    logApiError("GET", "/api/agents/default", 500, error, session?.user);
    return NextResponse.json(
      { error: "Failed to fetch default agents" },
      { status: 500 }
    );
  }
}
