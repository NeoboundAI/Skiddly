import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { generateOTP, sendEmail } from "@/lib/email";
import {
  logApiError,
  logApiSuccess,
  logAuthEvent,
  logDbOperation,
} from "@/lib/apiLogger";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      logApiError(
        "POST",
        "/api/auth/forgot-password",
        400,
        new Error("Email is required"),
        null
      );
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      logAuthEvent("forgot_password_user_not_found", { email });
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    logDbOperation(
      "read",
      "User",
      { id: user._id.toString(), email },
      {
        operation: "find_by_email_for_password_reset",
      }
    );

    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    user.otp = {
      code: otp,
      expiresAt: otpExpiry,
    };

    await user.save();

    logDbOperation(
      "update",
      "User",
      { id: user._id.toString(), email },
      {
        operation: "update_otp_for_password_reset",
        otpExpiry: otpExpiry,
      }
    );

    logAuthEvent(
      "forgot_password_otp_generated",
      { id: user._id.toString(), email },
      {
        userId: user._id.toString(),
        otpExpiry: otpExpiry,
      }
    );

    // console.log(otp); // Removed console.log
    // await sendEmail({
    //   to: email,
    //   subject: "Password Reset OTP",
    //   text: `Your OTP for password reset is: ${otp}. This code will expire in 10 minutes.`,
    // });

    logApiSuccess(
      "POST",
      "/api/auth/forgot-password",
      200,
      { id: user._id.toString(), email },
      {
        email: email,
      }
    );

    return NextResponse.json(
      { message: "OTP sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    logApiError("POST", "/api/auth/forgot-password", 500, error, null, {
      email: req.body?.email,
    });
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
