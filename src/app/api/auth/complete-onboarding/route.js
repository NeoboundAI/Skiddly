import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import {
  logApiError,
  logApiSuccess,
  logAuthFailure,
  logDbOperation,
  logBusinessEvent,
} from "@/lib/apiLogger";

export async function POST(req) {
  try {
    const session = await auth();

    if (!session) {
      logAuthFailure(
        "POST",
        "/api/auth/complete-onboarding",
        null,
        "No session"
      );
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Update user's onboarding status
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        onboardingCompleted: true,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) {
      logApiError(
        "POST",
        "/api/auth/complete-onboarding",
        404,
        new Error("User not found"),
        session.user.id
      );
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    logDbOperation("update", "User", session.user.id, {
      operation: "complete_onboarding",
      previousStatus: false,
      newStatus: true,
    });

    logBusinessEvent("onboarding_completed", session.user.id, {
      email: updatedUser.email,
      provider: updatedUser.provider,
    });

    logApiSuccess(
      "POST",
      "/api/auth/complete-onboarding",
      200,
      session.user.id,
      {
        email: updatedUser.email,
      }
    );

    return NextResponse.json(
      {
        message: "Onboarding completed successfully",
        user: {
          id: updatedUser._id.toString(),
          email: updatedUser.email,
          name: updatedUser.name,
          image: updatedUser.image,
          emailVerified: updatedUser.emailVerified,
          provider: updatedUser.provider,
          onboardingCompleted: updatedUser.onboardingCompleted,
          plan: updatedUser.plan,
          credits: updatedUser.credits,
          planDetails: updatedUser.planDetails,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logApiError(
      "POST",
      "/api/auth/complete-onboarding",
      500,
      error,
      session?.user?.id
    );
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
