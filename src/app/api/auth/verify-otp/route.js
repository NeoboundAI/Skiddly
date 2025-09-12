import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import {
  logApiError,
  logApiSuccess,
  logAuthEvent,
  logDbOperation,
} from "@/lib/apiLogger";

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    // Input validation
    if (!email || !otp) {
      logApiError(
        "POST",
        "/api/auth/verify-otp",
        400,
        new Error("Missing email or OTP"),
        null,
        {
          missingFields: { email: !email, otp: !otp },
        }
      );
      return NextResponse.json(
        { message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(trimmedEmail)) {
      logApiError(
        "POST",
        "/api/auth/verify-otp",
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

    // Find user by email
    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      logAuthEvent("verify_otp_user_not_found", { email: trimmedEmail });
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    logDbOperation(
      "read",
      "User",
      { id: user._id.toString(), email: trimmedEmail },
      {
        operation: "find_by_email_for_otp_verification",
      }
    );

    // Check if OTP exists and is valid
    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      logAuthEvent(
        "verify_otp_no_otp",
        { id: user._id.toString(), email: trimmedEmail },
        {
          userId: user._id.toString(),
        }
      );
      return NextResponse.json(
        { message: "No OTP found. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (new Date() > new Date(user.otp.expiresAt)) {
      logAuthEvent(
        "verify_otp_expired",
        { id: user._id.toString(), email: trimmedEmail },
        {
          userId: user._id.toString(),
          expiresAt: user.otp.expiresAt,
        }
      );
      return NextResponse.json(
        { message: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify OTP
    if (user.otp.code !== otp) {
      logAuthEvent(
        "verify_otp_invalid",
        { id: user._id.toString(), email: trimmedEmail },
        {
          userId: user._id.toString(),
          providedOtp: otp,
        }
      );
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    // OTP is valid - don't clear it yet as it's needed for password reset
    logAuthEvent(
      "verify_otp_success",
      { id: user._id.toString(), email: trimmedEmail },
      {
        userId: user._id.toString(),
      }
    );

    logApiSuccess(
      "POST",
      "/api/auth/verify-otp",
      200,
      { id: user._id.toString(), email: trimmedEmail },
      {
        email: trimmedEmail,
      }
    );

    return NextResponse.json(
      { message: "OTP verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    logApiError("POST", "/api/auth/verify-otp", 500, error, null, {
      email: req.body?.email,
    });
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
