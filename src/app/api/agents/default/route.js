import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import DefaultAgent from "@/models/DefaultAgent";

export async function GET(request) {
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

    // Get all enabled default agents
    const defaultAgents = await DefaultAgent.find({ enabled: true }).select(
      "name description type category languages enabled assistantId"
    );

    return NextResponse.json({
      success: true,
      data: defaultAgents,
    });
  } catch (error) {
    console.error("Error fetching default agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch default agents" },
      { status: 500 }
    );
  }
}
