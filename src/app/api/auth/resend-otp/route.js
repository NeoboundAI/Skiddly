import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { generateOTP, sendEmail } from "@/lib/email";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

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

    // Send new OTP email
    await sendEmail({
      to: email,
      subject: "Password Reset OTP (Resent)",
      text: `Your new OTP for password reset is: ${otp}. This code will expire in 10 minutes.`,
    });

    return NextResponse.json(
      { message: "OTP resent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
