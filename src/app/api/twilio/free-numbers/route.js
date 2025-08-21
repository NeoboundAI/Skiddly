import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // Fetch available numbers from Twilio API
    const response = await fetch(
      "https://api.twilio.com/2010-04-01/Accounts/AC9a4c5b44d4791e6a186fa8ad2d87fbab/IncomingPhoneNumbers.json?Status=active",
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
          ).toString("base64")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch Twilio numbers");
    }

    const data = await response.json();

    // Filter and format the numbers
    const availableNumbers = data.incoming_phone_numbers
      .filter(
        (number) =>
          number.status === "in-use" &&
          number.voice_url?.includes("api.vapi.ai")
      )
      .map((number) => ({
        phoneNumber: number.phone_number,
        friendlyName: number.friendly_name,
        sid: number.sid,
        capabilities: number.capabilities,
      }));

    return NextResponse.json({
      success: true,
      numbers: availableNumbers,
    });
  } catch (error) {
    console.error("Error fetching free numbers:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch available numbers" },
      { status: 500 }
    );
  }
}
