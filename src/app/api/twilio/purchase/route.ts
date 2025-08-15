import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { importTwilioNumberToVapi } from "@/app/api/handlers/twilio";
import {
  badRequestResponse,
  notFoundResponse,
  serverErrorResponse,
  successResponse,
} from "@/app/api/handlers/apiResponses";

export async function GET(): Promise<NextResponse> {
  try {
    const twilioClient = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_TOKEN
    );

    const numbers = await twilioClient.availablePhoneNumbers("US").local.list();
    if (numbers.length === 0) {
      console.error("No available phone numbers found in Twilio");
      return notFoundResponse();
    }
    return NextResponse.json(numbers, { status: 200 });
  } catch (error) {
    console.error("Error fetching Twilio phone numbers:", error);
    return serverErrorResponse();
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { phoneNumber } = await req.json();
    if (!phoneNumber) {
      return badRequestResponse("Phone number is required for purchase");
    }

    /**
     * Step 1: TODO: Check Amount paid for the phone number
     */

    /*
     * Step 2: Purchase phone number from Twilio
     */
    const twilioClient = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_TOKEN
    );

    const purchasedNumber = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber,
    });

    if (!purchasedNumber.sid) {
      console.error("Failed to purchase phone number from Twilio");
      return serverErrorResponse();
    }

    /**
     * Step 3: import twlio number to VAPI
     */
    const isSuccess = await importTwilioNumberToVapi({
      sid: process.env.TWILIO_SID as string,
      token: process.env.TWILIO_TOKEN as string,
      phoneNumber: purchasedNumber.phoneNumber,
      phoneNumberSid: purchasedNumber.sid,
    });

    if (!isSuccess) {
      console.error("Failed to import Twilio number to VAPI");
      return serverErrorResponse();
    }

    return successResponse({
      message: "Phone number purchased and imported successfully",
    });
  } catch (error) {
    console.error("Error purchasing phone number:", error);
    return serverErrorResponse();
  }
}
