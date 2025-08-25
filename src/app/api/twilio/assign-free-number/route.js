import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "../../../../lib/mongodb";
import TwilioNumber from "../../../../models/TwilioNumber";
import DefaultNumber from "../../../../models/DefaultNumber";
import User from "../../../../models/User";

export async function POST(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { phoneNumber, sid } = await req.json();

    if (!phoneNumber || !sid) {
      return NextResponse.json(
        { success: false, message: "Phone number and SID are required" },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user already has a number (one free number per user)
    const existingNumber = await TwilioNumber.findOne({
      userId: user._id,
      isActive: true,
    });
    if (existingNumber) {
      return NextResponse.json(
        { success: false, message: "User already has an active number" },
        { status: 400 }
      );
    }

    // Get the default number data to extract VAPI information
    const defaultNumber = await DefaultNumber.findOne({
      phone_number: phoneNumber,
      sid: sid,
      isActive: true,
    });

    if (!defaultNumber) {
      return NextResponse.json(
        { success: false, message: "Free number not found or not available" },
        { status: 404 }
      );
    }

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

    // Note: We don't update the DefaultNumber status anymore
    // This allows multiple users to use the same default number
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
    console.error("Error assigning free number:", error);
    return NextResponse.json(
      { success: false, message: "Failed to assign number" },
      { status: 500 }
    );
  }
}
