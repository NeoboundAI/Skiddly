import { NextResponse } from "next/server";
import twilio from "twilio";
import { importTwilioNumberToVapi } from "@/app/api/handlers/twilio";
import {
  badRequestResponse,
  notFoundResponse,
  serverErrorResponse,
  successResponse,
} from "@/app/api/handlers/apiResponses";
import {
  logApiError,
  logApiSuccess,
  logExternalApi,
  logExternalApiError,
} from "@/lib/apiLogger";

export async function GET() {
  try {
    const sid = process.env.TWILIO_SID;
    const token = process.env.TWILIO_TOKEN;
    if (!sid || !token) {
      logApiError(
        "GET",
        "/api/twilio/purchase",
        500,
        new Error("Missing TWILIO_SID/TWILIO_TOKEN"),
        null
      );
      return serverErrorResponse();
    }

    const twilioClient = twilio(sid, token);
    const numbers = await twilioClient.availablePhoneNumbers("US").local.list();

    if (numbers.length === 0) {
      logApiError(
        "GET",
        "/api/twilio/purchase",
        404,
        new Error("No available phone numbers found in Twilio"),
        null
      );
      return notFoundResponse();
    }

    logExternalApi("Twilio", "fetch_available_numbers", null, {
      count: numbers.length,
      country: "US",
    });

    logApiSuccess("GET", "/api/twilio/purchase", 200, null, {
      numberCount: numbers.length,
    });

    return NextResponse.json(numbers, { status: 200 });
  } catch (error) {
    logExternalApiError("Twilio", "fetch_available_numbers", error, null);
    logApiError("GET", "/api/twilio/purchase", 500, error, null);
    return serverErrorResponse();
  }
}

export async function POST(req) {
  try {
    const { phoneNumber } = await req.json();
    if (!phoneNumber) {
      logApiError(
        "POST",
        "/api/twilio/purchase",
        400,
        new Error("Phone number is required for purchase"),
        null
      );
      return badRequestResponse("Phone number is required for purchase");
    }

    /**
     * Step 1: TODO: Check Amount paid for the phone number
     */

    const sid = process.env.TWILIO_SID;
    const token = process.env.TWILIO_TOKEN;
    if (!sid || !token) {
      logApiError(
        "POST",
        "/api/twilio/purchase",
        500,
        new Error("Missing TWILIO_SID/TWILIO_TOKEN"),
        null,
        {
          phoneNumber,
        }
      );
      return serverErrorResponse();
    }

    /*
     * Step 2: Purchase phone number from Twilio
     */
    const twilioClient = twilio(sid, token);

    logExternalApi("Twilio", "purchase_phone_number", null, {
      phoneNumber,
    });

    const purchasedNumber = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber,
    });

    if (!purchasedNumber.sid) {
      logExternalApiError(
        "Twilio",
        "purchase_phone_number",
        new Error("Failed to purchase phone number from Twilio"),
        null,
        {
          phoneNumber,
        }
      );
      return serverErrorResponse();
    }

    /**
     * Step 3: import twlio number to VAPI
     */
    logExternalApi("VAPI", "import_twilio_number", null, {
      phoneNumber: purchasedNumber.phoneNumber,
      twilioSid: purchasedNumber.sid,
    });

    const isSuccess = await importTwilioNumberToVapi({
      sid,
      token,
      phoneNumber: purchasedNumber.phoneNumber,
    });

    if (!isSuccess) {
      logExternalApiError(
        "VAPI",
        "import_twilio_number",
        new Error("Failed to import Twilio number to VAPI"),
        null,
        {
          phoneNumber: purchasedNumber.phoneNumber,
          twilioSid: purchasedNumber.sid,
        }
      );
      return serverErrorResponse();
    }

    logApiSuccess("POST", "/api/twilio/purchase", 200, null, {
      phoneNumber: purchasedNumber.phoneNumber,
      twilioSid: purchasedNumber.sid,
    });

    return successResponse({
      message: "Phone number purchased and imported successfully",
    });
  } catch (error) {
    logApiError("POST", "/api/twilio/purchase", 500, error, null, {
      phoneNumber: req.body?.phoneNumber,
    });
    return serverErrorResponse();
  }
}
