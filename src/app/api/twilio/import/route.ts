import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { importTwilioNumberToVapi } from "@/app/api/handlers/twilio";
import {
  badRequestResponse,
  serverErrorResponse,
  successResponse,
} from "../../handlers/apiResponses";
interface TwilioRequestBody {
  sid: string;
  token: string;
  phoneNumber: string;
  phoneNumberSid?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { sid, token, phoneNumber, phoneNumberSid }: TwilioRequestBody =
      await req.json();

    if (!sid || !token || !phoneNumber) {
      return badRequestResponse(
        "Twilio SID, token, and phone number are required"
      );
    }

    const isSuccess = await importTwilioNumberToVapi({
      sid,
      token,
      phoneNumber,
      phoneNumberSid,
    });

    if (!isSuccess) {
      console.error("Failed to import Twilio number");
      return serverErrorResponse();
    }

    return successResponse({ message: "Twilio number imported successfully" });
  } catch (error) {
    console.error("Error in import twillio", error);
    return serverErrorResponse();
  }
}
