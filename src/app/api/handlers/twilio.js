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

    // First, try to create the phone number
    try {
      const response = await vapiClient.phoneNumbers.create({
        provider: "twilio",
        number: phoneNumber,
        twilioAccountSid: sid,
        twilioAuthToken: token,
      });

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
    } catch (createError) {
      // If creation fails, check if it's because the number already exists
      if (
        createError.statusCode === 400 &&
        createError.body?.message?.includes("Existing Phone Number")
      ) {
        console.log(
          `Phone number ${phoneNumber} already exists in VAPI, fetching existing details...`
        );

        // Fetch existing phone numbers to find the matching one
        const existingNumbers = await vapiClient.phoneNumbers.list();
        const existingNumber = existingNumbers.find(
          (num) => num.number === phoneNumber && num.twilioAccountSid === sid
        );

        if (existingNumber) {
          console.log(`Found existing VAPI number: ${existingNumber.id}`);
          return {
            success: true,
            vapiData: {
              vapiNumberId: existingNumber.id,
              orgId: existingNumber.orgId,
              twilioAccountSid: existingNumber.twilioAccountSid,
              status: existingNumber.status,
            },
          };
        } else {
          console.error(
            `Phone number ${phoneNumber} exists but couldn't be found in VAPI list`
          );
          return { success: false };
        }
      } else {
        // If it's a different error, throw it
        throw createError;
      }
    }
  } catch (vapiError) {
    console.error("VAPI Error:", vapiError);
    return { success: false };
  }
};
