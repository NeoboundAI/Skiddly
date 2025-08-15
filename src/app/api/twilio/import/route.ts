import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import twilio from "twilio";
import { VapiClient } from "@vapi-ai/server-sdk";
import { IncomingPhoneNumberInstance } from "twilio/lib/rest/api/v2010/account/incomingPhoneNumber";

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
      return NextResponse.json(
        { message: "SID, token, and phone number are required" },
        { status: 400 }
      );
    }

    // Initialize Twilio client
    const client = twilio(sid, token);

    // Step 1: Validate Twilio credentials & phone number
    let phoneDetails: IncomingPhoneNumberInstance;

    try {
      if (phoneNumberSid) {
        // Validate specific phone SID
        phoneDetails = await client
          .incomingPhoneNumbers(phoneNumberSid)
          .fetch();

        if (phoneDetails.phoneNumber !== phoneNumber) {
          return NextResponse.json(
            { message: "Phone number SID does not match the provided number" },
            { status: 400 }
          );
        }
      } else {
        // Get all incoming numbers
        const numbers = await client.incomingPhoneNumbers.list();
        const matched = numbers.find((num) => num.phoneNumber === phoneNumber);

        if (!matched) {
          return NextResponse.json(
            { message: "Phone number not found in Twilio account" },
            { status: 404 }
          );
        }

        phoneDetails = matched;
      }
    } catch (error) {
      if ((error as any).code === 20003) {
        return NextResponse.json(
          { message: "Invalid Twilio credentials" },
          { status: 401 }
        );
      }
      throw error;
    }

    // Step 2: Save to database
    // await saveTwilioNumber({ sid, token, phoneNumber, phoneNumberSid: phoneDetails.sid });

    // Step 3: Attach to VAPI
    try {
      const vapiClient = new VapiClient({
        token: process.env.VAPI_TOKEN as string,
      });

      await vapiClient.phoneNumbers.create({
        provider: "twilio",
        number: phoneNumber,
        twilioAccountSid: sid,
        twilioAuthToken: token,
      });

      return NextResponse.json(
        { message: "Twilio import request processed successfully" },
        { status: 200 }
      );
    } catch (vapiError) {
      console.error("VAPI Error:", vapiError);
      return NextResponse.json(
        { message: "Failed to attach number to VAPI" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in import twillio", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
