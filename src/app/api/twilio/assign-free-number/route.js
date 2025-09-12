import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "../../../../lib/mongodb";
import TwilioNumber from "../../../../models/TwilioNumber";
import DefaultNumber from "../../../../models/DefaultNumber";
import User from "../../../../models/User";
import {
  logApiError,
  logApiSuccess,
  logAuthFailure,
  logDbOperation,
  logBusinessEvent,
} from "@/lib/apiLogger";

export async function POST(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      logAuthFailure(
        "POST",
        "/api/twilio/assign-free-number",
        null,
        "No session or user email"
      );
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { phoneNumber, sid } = await req.json();

    if (!phoneNumber || !sid) {
      logApiError(
        "POST",
        "/api/twilio/assign-free-number",
        400,
        new Error("Phone number and SID are required"),
        session.user.id,
        {
          missingFields: { phoneNumber: !phoneNumber, sid: !sid },
        }
      );
      return NextResponse.json(
        { success: false, message: "Phone number and SID are required" },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      logAuthFailure(
        "POST",
        "/api/twilio/assign-free-number",
        session.user,
        "User not found in database"
      );
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if this specific number is already assigned to this user (prevent duplicates)
    const existingNumber = await TwilioNumber.findOne({
      userId: user._id,
      phoneNumber: phoneNumber,
      sid: sid,
      isActive: true,
    });
    if (existingNumber) {
      logApiError(
        "POST",
        "/api/twilio/assign-free-number",
        400,
        new Error("User already has this specific number assigned"),
        session.user,
        {
          existingNumberId: existingNumber._id.toString(),
          phoneNumber: existingNumber.phoneNumber,
        }
      );
      return NextResponse.json(
        { success: false, message: "You already have this number assigned" },
        { status: 400 }
      );
    }

    logDbOperation("read", "TwilioNumber", session.user, {
      operation: "check_existing_number_assignment",
      hasExistingNumber: !!existingNumber,
    });

    // Get the default number data to extract VAPI information
    const defaultNumber = await DefaultNumber.findOne({
      phone_number: phoneNumber,
      sid: sid,
      isActive: true,
    });

    if (!defaultNumber) {
      logApiError(
        "POST",
        "/api/twilio/assign-free-number",
        404,
        new Error("Free number not found or not available"),
        session.user,
        {
          phoneNumber,
          sid,
        }
      );
      return NextResponse.json(
        { success: false, message: "Free number not found or not available" },
        { status: 404 }
      );
    }

    logDbOperation("read", "DefaultNumber", session.user, {
      operation: "find_default_number_for_assignment",
      phoneNumber,
      sid,
      vapiNumberId: defaultNumber.vapiNumberId,
    });

    // Create new number record with VAPI data
    const newNumber = await TwilioNumber.create({
      userId: user._id,
      phoneNumber,
      sid,
      token: process.env.TWILIO_AUTH_TOKEN, // Use our Twilio token for free numbers
      type: "free",
      maxCalls: 10, // Free numbers get 10 calls
      callsUsed: 0,
      isActive: true,
      assignedAt: new Date(),
      // VAPI Integration Data from DefaultNumber
      vapiNumberId: defaultNumber.vapiNumberId,
      vapiOrgId: defaultNumber.vapiOrgId,
      vapiStatus: defaultNumber.vapiStatus,
    });

    logDbOperation("create", "TwilioNumber", session.user, {
      numberId: newNumber._id.toString(),
      phoneNumber,
      type: "free",
      maxCalls: 10,
      vapiNumberId: defaultNumber.vapiNumberId,
    });

    logBusinessEvent("free_number_assigned", session.user, {
      phoneNumber,
      numberId: newNumber._id.toString(),
      vapiNumberId: defaultNumber.vapiNumberId,
      maxCalls: 10,
    });

    logApiSuccess("POST", "/api/twilio/assign-free-number", 200, session.user, {
      phoneNumber,
      numberId: newNumber._id.toString(),
    });

    // Note: We don't update the DefaultNumber status
    // Free numbers can be assigned to multiple users
    // The default number remains available for other users

    return NextResponse.json({
      success: true,
      message: "Free number assigned successfully",
      number: {
        id: newNumber._id,
        phoneNumber: newNumber.phoneNumber,
        type: newNumber.type,
        maxCalls: newNumber.maxCalls,
        callsUsed: newNumber.callsUsed,
        vapiNumberId: newNumber.vapiNumberId,
        vapiStatus: newNumber.vapiStatus,
      },
    });
  } catch (error) {
    logApiError(
      "POST",
      "/api/twilio/assign-free-number",
      500,
      error,
      session?.user?.id,
      {
        phoneNumber: req.body?.phoneNumber,
        sid: req.body?.sid,
      }
    );
    return NextResponse.json(
      { success: false, message: "Failed to assign number" },
      { status: 500 }
    );
  }
}
