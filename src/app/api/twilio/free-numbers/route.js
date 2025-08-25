import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import DefaultNumber from "../../../../models/DefaultNumber";
import {
  serverErrorResponse,
  successResponse,
} from "@/app/api/handlers/apiResponses";

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

    console.log(`Found ${availableNumbers.length} available default numbers`);

    return NextResponse.json({
      success: true,
      numbers: availableNumbers,
    });
  } catch (error) {
    console.error("Error fetching free numbers:", error);
    return serverErrorResponse("Failed to fetch available numbers");
  }
}
