import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { generateOTP, sendEmail } from "@/lib/email";
import {
  logApiError,
  logApiSuccess,
  logAuthEvent,
  logDbOperation,
  logExternalApi,
} from "@/lib/apiLogger";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      logApiError(
        "POST",
        "/api/auth/resend-otp",
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
        "/api/auth/resend-otp",
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

    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      logAuthEvent("resend_otp_user_not_found", trimmedEmail);
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    logDbOperation("read", "User", session.user, {
      operation: "find_by_email_for_otp_resend",
    });

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

    // Update user with new OTP
    user.otp = {
      code: otp,
      expiresAt: otpExpiry,
    };

    await user.save();

    logDbOperation("update", "User", session.user, {
      operation: "update_otp_for_resend",
      otpExpiry: otpExpiry,
    });

    logAuthEvent("resend_otp_generated", trimmedEmail, {
      userId: user._id.toString(),
      otpExpiry: otpExpiry,
    });

    // Send new OTP email
    logExternalApi("Email", "send_otp_email", user._id.toString(), {
      email: trimmedEmail,
      subject: "Password Reset OTP (Resent)",
    });

    await sendEmail({
      to: email,
      subject: "Password Reset OTP (Resent)",
      text: `Your new OTP for password reset is: ${otp}. This code will expire in 10 minutes.`,
    });

    logApiSuccess("POST", "/api/auth/resend-otp", 200, session.user, {
      email: trimmedEmail,
    });

    return NextResponse.json(
      { message: "OTP resent successfully" },
      { status: 200 }
    );
  } catch (error) {
    logApiError("POST", "/api/auth/resend-otp", 500, error, null, {
      email: req.body?.email,
    });
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
