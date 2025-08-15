import twilio from "twilio";
import { VapiClient } from "@vapi-ai/server-sdk";
import { IncomingPhoneNumberInstance } from "twilio/lib/rest/api/v2010/account/incomingPhoneNumber";

interface TwilioAccountDetails {
  sid: string;
  token: string;
  phoneNumber: string;
  phoneNumberSid?: string;
}
/**
 * Method to import Twilio phone numbers to VAPI.
 */
export const importTwilioNumberToVapi = async ({
  sid,
  token,
  phoneNumber,
  phoneNumberSid,
}: TwilioAccountDetails): Promise<boolean> => {
  // Initialize Twilio client
  const client = twilio(sid, token);

  // Step 1: Validate Twilio credentials & phone number
  let phoneDetails: IncomingPhoneNumberInstance;

  try {
    if (phoneNumberSid) {
      // Validate specific phone SID
      phoneDetails = await client.incomingPhoneNumbers(phoneNumberSid).fetch();

      if (phoneDetails.phoneNumber !== phoneNumber) {
        console.error(
          `Phone number mismatch: Expected ${phoneNumber}, got ${phoneDetails.phoneNumber}`
        );
        return false;
      }
    } else {
      // Get all incoming numbers
      const numbers = await client.incomingPhoneNumbers.list();
      const matched = numbers.find((num) => num.phoneNumber === phoneNumber);

      if (!matched) {
        console.error(
          `Phone number ${phoneNumber} not found in Twilio account`
        );
        return false;
      }

      phoneDetails = matched;
    }
  } catch (error) {
    console.error("Twilio Error:", error);
    return false;
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

    console.log(`Successfully attached ${phoneNumber} to VAPI`);
    return true;
  } catch (vapiError) {
    console.error("VAPI Error:", vapiError);
    return false;
  }
};
