import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Agent from "@/models/Agent";

export async function PUT(request, { params }) {
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
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

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

    return NextResponse.json({
      success: true,
      data: updatedAgent,
    });
  } catch (error) {
    console.error("Error updating agent with VAPI configuration:", error);
    return NextResponse.json(
      { error: "Failed to update agent with VAPI configuration" },
      { status: 500 }
    );
  }
}
