import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req) {
  try {
    const { email } = await req.json();

    // Input validation
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

    // Check if user already exists
    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });

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
    console.error("Email check error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
