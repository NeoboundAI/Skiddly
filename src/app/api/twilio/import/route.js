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
import {
  logApiError,
  logApiSuccess,
  logAuthFailure,
  logDbOperation,
  logExternalApi,
  logExternalApiError,
  logBusinessEvent,
} from "@/lib/apiLogger";

export async function POST(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      logAuthFailure(
        "POST",
        "/api/twilio/import",
        null,
        "No session or user email"
      );
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { sid, token, phoneNumber } = await req.json();

    if (!sid || !token || !phoneNumber) {
      logApiError(
        "POST",
        "/api/twilio/import",
        400,
        new Error("Missing required fields"),
        session.user,
        {
          missingFields: {
            sid: !sid,
            token: !token,
            phoneNumber: !phoneNumber,
          },
        }
      );
      return badRequestResponse(
        "Twilio SID, token, and phone number are required"
      );
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      logAuthFailure(
        "POST",
        "/api/twilio/import",
        session.user,
        "User not found in database"
      );
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
      logApiError(
        "POST",
        "/api/twilio/import",
        400,
        new Error("User already has an active number"),
        session.user,
        {
          existingNumberId: existingNumber._id.toString(),
          phoneNumber: existingNumber.phoneNumber,
        }
      );
      return NextResponse.json(
        { success: false, message: "User already has an active number" },
        { status: 400 }
      );
    }

    logDbOperation("read", "TwilioNumber", session.user, {
      operation: "check_existing_active_number",
      hasExistingNumber: !!existingNumber,
    });

    // Import to Vapi
    logExternalApi("VAPI", "import_twilio_number", user._id.toString(), {
      phoneNumber,
      twilioSid: sid,
    });

    const vapiResult = await importTwilioNumberToVapi({
      sid,
      token,
      phoneNumber,
    });

    if (!vapiResult.success) {
      logExternalApiError(
        "VAPI",
        "import_twilio_number",
        new Error("Failed to import Twilio number to Vapi"),
        user._id.toString(),
        {
          phoneNumber,
          twilioSid: sid,
        }
      );
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

    logDbOperation("create", "TwilioNumber", session.user, {
      numberId: newNumber._id.toString(),
      phoneNumber,
      type: "own",
      vapiNumberId: vapiResult.vapiData.vapiNumberId,
    });

    logBusinessEvent("twilio_number_imported", session.user, {
      phoneNumber,
      vapiNumberId: vapiResult.vapiData.vapiNumberId,
      vapiStatus: vapiResult.vapiData.status,
    });

    logApiSuccess("POST", "/api/twilio/import", 200, session.user, {
      phoneNumber,
      numberId: newNumber._id.toString(),
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
    logApiError("POST", "/api/twilio/import", 500, error, session?.user, {
      phoneNumber: req.body?.phoneNumber,
    });
    return serverErrorResponse();
  }
}
