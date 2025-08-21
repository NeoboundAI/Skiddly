import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "../../../../lib/mongodb";
import TwilioNumber from "../../../../models/TwilioNumber";
import User from "../../../../models/User";
import { importTwilioNumberToVapi } from "@/app/api/handlers/twilio";
import {
  badRequestResponse,
  serverErrorResponse,
  successResponse,
} from "@/app/api/handlers/apiResponses";

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

    const { sid, token, phoneNumber } = await req.json();

    if (!sid || !token || !phoneNumber) {
      return badRequestResponse(
        "Twilio SID, token, and phone number are required"
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

    // Check if user already has a number
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

    // Import to Vapi
    const vapiResult = await importTwilioNumberToVapi({
      sid,
      token,
      phoneNumber,
    });

    if (!vapiResult.success) {
      console.error("Failed to import Twilio number to Vapi");
      return serverErrorResponse();
    }

    // Save to database with VAPI data
    const newNumber = await TwilioNumber.create({
      userId: user._id,
      phoneNumber,
      sid,
      token,
      type: "own",
      maxCalls: 0, // Unlimited for own numbers
      callsUsed: 0,
      isActive: true,
      assignedAt: new Date(),
      // VAPI Integration Data
      vapiNumberId: vapiResult.vapiData.vapiNumberId,
      vapiOrgId: vapiResult.vapiData.orgId,
      vapiStatus: vapiResult.vapiData.status,
    });

    return NextResponse.json({
      success: true,
      message: "Twilio number imported and saved successfully",
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
    console.error("Error in import twilio", error);
    return serverErrorResponse();
  }
}
