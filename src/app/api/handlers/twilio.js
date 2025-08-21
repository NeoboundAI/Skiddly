import twilio from "twilio";
import { VapiClient } from "@vapi-ai/server-sdk";

/**
 * Method to import Twilio phone numbers to VAPI.
 */
export const importTwilioNumberToVapi = async ({ sid, token, phoneNumber }) => {
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
      return { success: false };
    }
  } catch (error) {
    console.error("Twilio Error:", error);
    return { success: false };
  }

  // Step 2: Attach to VAPI
  try {
    const vapiClient = new VapiClient({
      token: process.env.VAPI_API_KEY,
    });

    const response = await vapiClient.phoneNumbers.create({
      provider: "twilio",
      number: phoneNumber,
      twilioAccountSid: sid,
      twilioAuthToken: token,
    });
    console.log("response", response);

    console.log(`Successfully attached ${phoneNumber} to VAPI`);
    return {
      success: true,
      vapiData: {
        vapiNumberId: response.id,
        orgId: response.orgId,
        twilioAccountSid: response.twilioAccountSid,
        status: response.status,
      },
    };
  } catch (vapiError) {
    console.error("VAPI Error:", vapiError);
    return { success: false };
  }
};
