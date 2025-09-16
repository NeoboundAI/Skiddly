import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import subscriptionService from "../../../../services/subscriptionService";
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

    const session = await auth();
    if (!session) {
      logAuthFailure("POST", "/api/auth/update-plan", null, "No session");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await request.json();

    if (
      !plan ||
      !["free_trial", "starter", "growth", "scale", "enterprise"].includes(plan)
    ) {
      logApiError(
        "POST",
        "/api/auth/update-plan",
        400,
        new Error("Invalid plan selected"),
        session.user.id,
        {
          providedPlan: plan,
          validPlans: [
            "free_trial",
            "starter",
            "growth",
            "scale",
            "enterprise",
          ],
        }
      );
      return NextResponse.json(
        { message: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // Use subscription service to handle plan upgrade
    const userPlan = await subscriptionService.upgradePlan(
      session.user.id,
      plan,
      "onboarding_selection"
    );

    logDbOperation("update", "UserPlan", session.user.id, {
      operation: "upgrade_plan",
      newPlan: plan,
      planId: userPlan._id,
    });

    logBusinessEvent("plan_upgraded", session.user.id, {
      email: session.user.email,
      newPlan: plan,
      planId: userPlan._id,
    });

    logApiSuccess("POST", "/api/auth/update-plan", 200, session.user.id, {
      email: session.user.email,
      plan: plan,
      planId: userPlan._id,
    });

    return NextResponse.json({
      message: "Plan updated successfully",
      user: {
        plan: plan,
        planId: userPlan._id,
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
