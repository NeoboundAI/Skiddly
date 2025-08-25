import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import DefaultNumber from "../../../../models/DefaultNumber";
import {
  serverErrorResponse,
  successResponse,
} from "@/app/api/handlers/apiResponses";
import { logApiError, logApiSuccess, logDbOperation } from "@/lib/apiLogger";

export async function GET(req) {
  try {
    await connectDB();

    // Fetch all available default numbers (shared among users)
    const availableNumbers = await DefaultNumber.find({
      isActive: true,
      vapiStatus: "active",
    }).select({
      phone_number: 1,
      friendly_name: 1,
      sid: 1,
      capabilities: 1,
      vapiNumberId: 1,
      vapiOrgId: 1,
      vapiStatus: 1,
      account_sid: 1,
      voice_url: 1,
      sms_url: 1,
      status_callback: 1,
    });

    logDbOperation("read", "DefaultNumber", null, {
      operation: "fetch_available_free_numbers",
      count: availableNumbers.length,
      filter: "isActive=true, vapiStatus=active",
    });

    logApiSuccess("GET", "/api/twilio/free-numbers", 200, null, {
      numberCount: availableNumbers.length,
    });

    return NextResponse.json({
      success: true,
      numbers: availableNumbers,
    });
  } catch (error) {
    logApiError("GET", "/api/twilio/free-numbers", 500, error, null);
    return serverErrorResponse("Failed to fetch available numbers");
  }
}
