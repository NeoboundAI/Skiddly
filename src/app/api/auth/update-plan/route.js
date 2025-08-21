import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";

export async function POST(request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await request.json();

    if (!plan || !["free", "infrasonic", "ultrasonic"].includes(plan)) {
      return NextResponse.json(
        { message: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // Define plan details based on selected plan
    const planConfigs = {
      free: {
        credits: 10,
        totalCredits: 10,
        agentCreationLimit: 1,
        dataRetentionDays: 30,
        monthlyActiveUsers: 4,
      },
      infrasonic: {
        credits: 100,
        totalCredits: 100,
        agentCreationLimit: 5,
        dataRetentionDays: 90,
        monthlyActiveUsers: 25,
      },
      ultrasonic: {
        credits: 500,
        totalCredits: 500,
        agentCreationLimit: -1, // Unlimited
        dataRetentionDays: 365,
        monthlyActiveUsers: 100,
      },
    };

    const planConfig = planConfigs[plan];
    const now = new Date();
    const planEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // Update user with plan details
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        plan,
        credits: planConfig.credits,
        planDetails: {
          ...planConfig,
          planStartDate: now,
          planEndDate,
        },
      },
      { new: true }
    );
    console.log("Updated user:", updatedUser);

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Plan updated successfully",
      user: {
        plan: updatedUser.plan,
        credits: updatedUser.credits,
        planDetails: updatedUser.planDetails,
      },
    });
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
