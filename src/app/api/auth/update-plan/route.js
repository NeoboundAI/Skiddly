import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import {
  logApiError,
  logApiSuccess,
  logAuthFailure,
  logDbOperation,
  logBusinessEvent,
} from "@/lib/apiLogger";

export async function POST(request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      logAuthFailure("POST", "/api/auth/update-plan", null, "No session");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await request.json();

    if (!plan || !["free", "infrasonic", "ultrasonic"].includes(plan)) {
      logApiError(
        "POST",
        "/api/auth/update-plan",
        400,
        new Error("Invalid plan selected"),
        session.user.id,
        {
          providedPlan: plan,
          validPlans: ["free", "infrasonic", "ultrasonic"],
        }
      );
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

    if (!updatedUser) {
      logApiError(
        "POST",
        "/api/auth/update-plan",
        404,
        new Error("User not found"),
        session.user.id,
        {
          email: session.user.email,
        }
      );
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    logDbOperation("update", "User", session.user.id, {
      operation: "update_plan",
      previousPlan: updatedUser.plan,
      newPlan: plan,
      credits: planConfig.credits,
    });

    logBusinessEvent("plan_updated", session.user.id, {
      email: updatedUser.email,
      previousPlan: updatedUser.plan,
      newPlan: plan,
      credits: planConfig.credits,
      planEndDate: planEndDate,
    });

    logApiSuccess("POST", "/api/auth/update-plan", 200, session.user.id, {
      email: updatedUser.email,
      plan: plan,
      credits: planConfig.credits,
    });

    return NextResponse.json({
      message: "Plan updated successfully",
      user: {
        plan: updatedUser.plan,
        credits: updatedUser.credits,
        planDetails: updatedUser.planDetails,
      },
    });
  } catch (error) {
    logApiError(
      "POST",
      "/api/auth/update-plan",
      500,
      error,
      session?.user?.id,
      {
        plan: request.body?.plan,
      }
    );
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
