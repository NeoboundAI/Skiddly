import { NextResponse } from "next/server";
import { httpRequest } from "@/lib/httpHandler";
// import { saveTwilioNumber } from "@/lib/db"; // hypothetical DB save function

export async function POST(req) {
  try {
    const { sid, token, phoneNumber, phoneNumberSid } = await req.json();

    if (!sid || !token || !phoneNumber) {
      return NextResponse.json(
        { message: "SID, token, and phone number are required" },
        { status: 400 }
      );
    }

    const twilioBaseUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}`;

    // Step 1: Validate Twilio credentials & phone number
    let phoneDetails;

    if (phoneNumberSid) {
      // Validate specific phone SID
      phoneDetails = await httpRequest(
        `${twilioBaseUrl}/IncomingPhoneNumbers/${phoneNumberSid}.json`,
        {
          method: "GET",
          headers: {
            Authorization: "Basic " + btoa(`${sid}:${token}`),
          },
        }
      );

      if (!phoneDetails || phoneDetails.phone_number !== phoneNumber) {
        return NextResponse.json(
          { message: "Phone number SID does not match the provided number" },
          { status: 400 }
        );
      }
    } else {
      // Get all incoming numbers
      const res = await httpRequest(
        `${twilioBaseUrl}/IncomingPhoneNumbers.json`,
        {
          method: "GET",
          headers: {
            Authorization: "Basic " + btoa(`${sid}:${token}`),
          },
        }
      );

      const matched = res?.incoming_phone_numbers?.find(
        (num) => num.phone_number === phoneNumber
      );

      if (!matched) {
        return NextResponse.json(
          { message: "Phone number not found in Twilio account" },
          { status: 404 }
        );
      }

      phoneDetails = matched;
    }

    // Step 2: Save to database
    // await saveTwilioNumber({ sid, token, phoneNumber, phoneNumberSid: phoneDetails.sid });

    // Step 3: Attach to VAPI
    const vapiResponse = await httpRequest("https://api.vapi.ai/phone-number", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VAPI_TOKEN}`,
      },
      data: {
        provider: "twilio",
        number: phoneNumber,
        twilioAccountSid: sid,
        twilioAuthToken: token,
      },
    });

    if (!vapiResponse || vapiResponse.error) {
      return NextResponse.json(
        { message: "Failed to attach number to VAPI" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Twilio import request processed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in import twillio", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
