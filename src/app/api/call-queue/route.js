import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Call from "@/models/Call";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 50;
    const status = searchParams.get("status");

    // Build query for calls in queue - be more inclusive
    let query = {
      $or: [
        { status: { $in: ["queued", "scheduled", "pending", "initiated"] } },
        { nextCallTime: { $gt: new Date() } },
      ],
    };

    if (status) {
      query.status = status;
    }

    const calls = await Call.find(query)
      .sort({ nextCallTime: 1, createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("abandonedCartId", "shopifyCheckoutId customerPhone cartValue")
      .populate("agentId", "name assistantId")
      .lean();

    console.log("Call queue query:", JSON.stringify(query, null, 2));
    console.log("Found calls in queue:", calls.length);

    // Transform data to match frontend expectations
    const transformedCalls = calls.map((call) => ({
      _id: call._id,
      callId: call.callId || call.vapiCallId,
      customerNumber: call.customerNumber,
      cartId: call.abandonedCartId?.shopifyCheckoutId || "Unknown",
      status: call.status,
      nextCallTime: call.nextCallTime,
      createdAt: call.createdAt,
      attemptNumber: call.attemptNumber || 1,
    }));

    const total = await Call.countDocuments(query);

    return NextResponse.json({
      success: true,
      calls: transformedCalls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching call queue:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch call queue" },
      { status: 500 }
    );
  }
}
