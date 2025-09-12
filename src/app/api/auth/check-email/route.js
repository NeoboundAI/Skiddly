import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { logApiError, logApiSuccess, logDbOperation } from "@/lib/apiLogger";

export async function POST(req) {
  try {
    const { email } = await req.json();

    // Input validation
    if (!email) {
      logApiError(
        "POST",
        "/api/auth/check-email",
        400,
        new Error("Email is required"),
        null
      );
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(trimmedEmail)) {
      logApiError(
        "POST",
        "/api/auth/check-email",
        400,
        new Error("Invalid email format"),
        null,
        {
          email: trimmedEmail,
        }
      );
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({
      email: trimmedEmail,
    });

    logDbOperation("read", "User", existingUser?._id?.toString() || null, {
      operation: "check_email_availability",
      email: trimmedEmail,
      exists: !!existingUser,
    });

    logApiSuccess(
      "POST",
      "/api/auth/check-email",
      200,
      existingUser?._id?.toString() || null,
      {
        email: trimmedEmail,
        exists: !!existingUser,
        available: !existingUser,
      }
    );

    return NextResponse.json(
      {
        exists: !!existingUser,
        available: !existingUser,
        message: existingUser
          ? "Email already registered"
          : "Email is available",
      },
      { status: 200 }
    );
  } catch (error) {
    logApiError("POST", "/api/auth/check-email", 500, error, null, {
      email: req.body?.email,
    });
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
