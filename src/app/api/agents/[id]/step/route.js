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

export async function PUT(request, { params }) {
  let session;
  let id;
  let body;
  try {
    // Get user session
    session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logAuthFailure(
        "PUT",
        "/api/agents/[id]/step",
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
        "/api/agents/[id]/step",
        session.user,
        "User not found in database"
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Await params before destructuring
    const resolvedParams = await params;
    id = resolvedParams.id;
    body = await request.json();
    const { step, data } = body;

    // Validate step parameter
    const validSteps = [
      "storeProfile",
      "commerceSettings",
      "callLogic",
      "offerEngine",
      "agentPersona",
      "objectionHandling",
      "testLaunch",
    ];

    if (!step || !validSteps.includes(step)) {
      return NextResponse.json(
        { error: "Invalid step parameter" },
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
        "/api/agents/[id]/step",
        404,
        new Error("Agent not found"),
        session.user,
        {
          agentId: id,
        }
      );
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Prepare update object with step data
    const updateData = {
      [step]: data,
    };

    // Update agent with step data
    const updatedAgent = await Agent.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    ).populate("shopifyShopId");
    console.log(updatedAgent);
    logDbOperation("update", "Agent", session.user, {
      agentId: id,
      operation: `update_${step}_step`,
      updatedFields: [step],
    });

    logApiSuccess("PUT", "/api/agents/[id]/step", 200, session.user, {
      agentId: id,
      step: step,
      agentName: updatedAgent.name,
    });

    return NextResponse.json({
      success: true,
      data: {
        step: step,
        updatedData: updatedAgent[step],
        agent: updatedAgent,
      },
    });
  } catch (error) {
    console.log(error);
    logApiError("PUT", "/api/agents/[id]/step", 500, error, session?.user, {
      agentId: id,
      step: body?.step,
    });
    return NextResponse.json(
      { error: "Failed to update agent step" },
      { status: 500 }
    );
  }
}
