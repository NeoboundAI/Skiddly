import { NextResponse } from "next/server";
import twilio from "twilio";
import { importTwilioNumberToVapi } from "@/app/api/handlers/twilio";
import {
  badRequestResponse,
  notFoundResponse,
  serverErrorResponse,
  successResponse,
} from "@/app/api/handlers/apiResponses";

export async function GET() {
  try {
    const sid = process.env.TWILIO_SID;
    const token = process.env.TWILIO_TOKEN;
    if (!sid || !token) {
      console.error("Missing TWILIO_SID/TWILIO_TOKEN");
      return serverErrorResponse();
    }

    const twilioClient = twilio(sid, token);
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

export async function POST(req) {
  try {
    const { phoneNumber } = await req.json();
    if (!phoneNumber) {
      return badRequestResponse("Phone number is required for purchase");
    }

    /**
     * Step 1: TODO: Check Amount paid for the phone number
     */

    const sid = process.env.TWILIO_SID;
    const token = process.env.TWILIO_TOKEN;
    if (!sid || !token) {
      console.error("Missing TWILIO_SID/TWILIO_TOKEN");
      return serverErrorResponse();
    }

    /*
     * Step 2: Purchase phone number from Twilio
     */
    const twilioClient = twilio(sid, token);
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
      sid,
      token,
      phoneNumber: purchasedNumber.phoneNumber,
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
