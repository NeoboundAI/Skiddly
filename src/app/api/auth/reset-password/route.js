import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req) {
  try {
    const { email, otp, newPassword } = await req.json();

    // Input validation
    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { message: "Email, OTP, and new password are required" },
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

    // Password validation
    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    if (newPassword.length > 128) {
      return NextResponse.json(
        { message: "Password must be less than 128 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Verify OTP again for security
    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      return NextResponse.json(
        { message: "No OTP found. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (new Date() > new Date(user.otp.expiresAt)) {
      return NextResponse.json(
        { message: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify OTP
    if (user.otp.code !== otp) {
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

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
