import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
    const { email, otp, newPassword } = await req.json();

    // Input validation
    if (!email || !otp || !newPassword) {
      logApiError(
        "POST",
        "/api/auth/reset-password",
        400,
        new Error("Missing required fields"),
        null,
        {
          missingFields: {
            email: !email,
            otp: !otp,
            newPassword: !newPassword,
          },
        }
      );
      return NextResponse.json(
        { message: "Email, OTP, and new password are required" },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(trimmedEmail)) {
      logApiError(
        "POST",
        "/api/auth/reset-password",
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

    // Password validation
    if (newPassword.length < 6) {
      logApiError(
        "POST",
        "/api/auth/reset-password",
        400,
        new Error("Password too short"),
        null,
        {
          passwordLength: newPassword.length,
        }
      );
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    if (newPassword.length > 128) {
      logApiError(
        "POST",
        "/api/auth/reset-password",
        400,
        new Error("Password too long"),
        null,
        {
          passwordLength: newPassword.length,
        }
      );
      return NextResponse.json(
        { message: "Password must be less than 128 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      logAuthEvent("reset_password_user_not_found", trimmedEmail);
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    logDbOperation("read", "User", session.user, {
      operation: "find_by_email_for_password_reset",
    });

    // Verify OTP again for security
    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      logAuthEvent("reset_password_no_otp", trimmedEmail, {
        userId: user._id.toString(),
      });
      return NextResponse.json(
        { message: "No OTP found. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (new Date() > new Date(user.otp.expiresAt)) {
      logAuthEvent("reset_password_otp_expired", trimmedEmail, {
        userId: user._id.toString(),
        expiresAt: user.otp.expiresAt,
      });
      return NextResponse.json(
        { message: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify OTP
    if (user.otp.code !== otp) {
      logAuthEvent("reset_password_invalid_otp", trimmedEmail, {
        userId: user._id.toString(),
        providedOtp: otp,
      });
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and clear OTP
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      otp: undefined, // Clear OTP after successful password reset
      updatedAt: new Date(),
    });

    logDbOperation("update", "User", session.user, {
      operation: "update_password_and_clear_otp",
    });

    logAuthEvent("reset_password_success", trimmedEmail, {
      userId: user._id.toString(),
    });

    logApiSuccess(
      "POST",
      "/api/auth/reset-password",
      200,
      session.user,
      {
        email: trimmedEmail,
      }
    );

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    logApiError("POST", "/api/auth/reset-password", 500, error, null, {
      email: req.body?.email,
    });
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
