import twilio from "twilio";
import { VapiClient } from "@vapi-ai/server-sdk";

interface TwilioAccountDetails {
  sid: string;
  token: string;
  phoneNumber: string;
}
/**
 * Method to import Twilio phone numbers to VAPI.
 */
export const importTwilioNumberToVapi = async ({
  sid,
  token,
  phoneNumber,
}: TwilioAccountDetails): Promise<boolean> => {
  // Initialize Twilio client
  const client = twilio(sid, token);

  console.log(`Importing Twilio number: ${phoneNumber}`);

  // Step 1: Validate Twilio credentials & phone number
  try {
    const phoneDetails = await client.incomingPhoneNumbers.list({
      phoneNumber,
      limit: 1,
    });

    if (!phoneDetails || phoneDetails.length === 0) {
      console.error(`Phone number ${phoneNumber} not found in Twilio account`);
      return false;
    }
  } catch (error) {
    console.error("Twilio Error:", error);
    return false;
  }

  // Step 2: Save to database
  // await saveTwilioNumber({ sid, token, phoneNumber });

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

    console.log(`Successfully attached ${phoneNumber} to VAPI`);
    return true;
  } catch (vapiError) {
    console.error("VAPI Error:", vapiError);
    return false;
  }
};
