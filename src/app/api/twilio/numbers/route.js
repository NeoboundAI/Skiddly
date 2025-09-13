import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "../../../../lib/mongodb";
import TwilioNumber from "../../../../models/TwilioNumber";
import User from "../../../../models/User";
import {
  logApiError,
  logApiSuccess,
  logDbOperation,
  logAuthFailure,
} from "@/lib/apiLogger";

export async function GET(req) {
  try {
    await connectDB();

    const session = await auth();
    if (!session?.user?.email) {
      logAuthFailure(
        "GET",
        "/api/twilio/numbers",
        null,
        "No session or user email"
      );
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      logAuthFailure(
        "GET",
        "/api/twilio/numbers",
        session.user,
        "User not found in database"
      );
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Fetch all active Twilio numbers for the user
    const numbers = await TwilioNumber.find({
      userId: user._id,
      isActive: true,
    }).select("phoneNumber type vapiNumberId vapiStatus createdAt");

    logDbOperation("read", "TwilioNumber", session.user, {
      count: numbers.length,
      filter: "active only",
    });

    logApiSuccess("GET", "/api/twilio/numbers", 200, session.user, {
      numberCount: numbers.length,
      hasNumbers: numbers.length > 0,
    });

    return NextResponse.json({
      success: true,
      numbers: numbers,
      hasNumbers: numbers.length > 0,
    });
  } catch (error) {
    logApiError("GET", "/api/twilio/numbers", 500, error, session?.user);
    return NextResponse.json(
      { success: false, message: "Failed to fetch numbers" },
      { status: 500 }
    );
  }
}
