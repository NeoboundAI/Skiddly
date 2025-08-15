import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import crypto from "crypto";

export async function POST(req) {
  try {
    const { otp, email } = await req.json();

    if (!otp || !email) {
      return NextResponse.json(
        { message: "OTP and email are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({
      email,
      "otp.code": otp,
      "otp.expiresAt": { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); 

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    user.otp = undefined; 

    await user.save();

    return NextResponse.json({ resetToken }, { status: 200 });
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
