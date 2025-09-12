import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import {
  logAuthEvent,
  logApiError,
  logDbOperation,
  logApiSuccess,
} from "@/lib/apiLogger";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    // Input validation
    if (!name || !email || !password) {
      logApiError(
        "POST",
        "/api/auth/register",
        400,
        new Error("Missing required fields"),
        null,
        {
          missingFields: { name: !name, email: !email, password: !password },
        }
      );
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Name validation
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      logApiError(
        "POST",
        "/api/auth/register",
        400,
        new Error("Name too short"),
        null,
        {
          nameLength: trimmedName.length,
        }
      );
      return NextResponse.json(
        { message: "Name must be at least 2 characters long" },
        { status: 400 }
      );
    }

    if (trimmedName.length > 50) {
      logApiError(
        "POST",
        "/api/auth/register",
        400,
        new Error("Name too long"),
        null,
        {
          nameLength: trimmedName.length,
        }
      );
      return NextResponse.json(
        { message: "Name must be less than 50 characters" },
        { status: 400 }
      );
    }

    // Email validation
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      logApiError(
        "POST",
        "/api/auth/register",
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
    if (password.length < 6) {
      logApiError(
        "POST",
        "/api/auth/register",
        400,
        new Error("Password too short"),
        null,
        {
          passwordLength: password.length,
        }
      );
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      logApiError(
        "POST",
        "/api/auth/register",
        400,
        new Error("Password too long"),
        null,
        {
          passwordLength: password.length,
        }
      );
      return NextResponse.json(
        { message: "Password must be less than 128 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    // Double-check if user already exists (race condition protection)
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      logAuthEvent(
        "register_duplicate",
        { email: trimmedEmail },
        {
          reason: "User already exists",
        }
      );
      return NextResponse.json(
        { message: "User already exists with this email" },
        { status: 409 }
      );
    }

    // Hash password with salt rounds
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
      emailVerified: true, // No email verification required
      provider: "credentials",
      onboardingCompleted: false, // New users need onboarding
      plan: "none",
      credits: 0,
      planDetails: {
        totalCredits: 0,
        agentCreationLimit: 0,
        dataRetentionDays: 0,
        monthlyActiveUsers: 0,
      },
      createdAt: new Date(),
      lastLogin: new Date(),
    });

    logDbOperation(
      "create",
      "User",
      { id: user._id.toString(), email: trimmedEmail },
      {
        email: trimmedEmail,
        name: trimmedName,
      }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject();

    logAuthEvent(
      "register_success",
      { id: user._id.toString(), email: trimmedEmail },
      {
        userId: user._id.toString(),
      }
    );

    logApiSuccess(
      "POST",
      "/api/auth/register",
      201,
      { id: user._id.toString(), email: trimmedEmail },
      {
        email: trimmedEmail,
      }
    );

    return NextResponse.json(
      {
        message: "User created successfully",
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      logAuthEvent(
        "register_duplicate",
        { email: email },
        {
          reason: "MongoDB duplicate key error",
        }
      );
      return NextResponse.json(
        { message: "User already exists with this email" },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      logApiError("POST", "/api/auth/register", 400, error, null, {
        validationErrors,
      });
      return NextResponse.json(
        { message: validationErrors.join(", ") },
        { status: 400 }
      );
    }

    logApiError("POST", "/api/auth/register", 500, error, null, {
      email: email,
    });

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
