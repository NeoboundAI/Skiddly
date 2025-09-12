import twilio from "twilio";
import { VapiClient } from "@vapi-ai/server-sdk";
import {
  logExternalApi,
  logExternalApiError,
  logBusinessEvent,
} from "@/lib/apiLogger";

/**
 * Method to import Twilio phone numbers to VAPI.
 */
export const importTwilioNumberToVapi = async ({ sid, token, phoneNumber }) => {
  // Initialize Twilio client
  const client = twilio(sid, token);

  logBusinessEvent("twilio_import_started", null, {
    phoneNumber,
  });

  // Step 1: Validate Twilio credentials & phone number
  try {
    logExternalApi("Twilio", "validate_phone_number", null, {
      phoneNumber,
    });

    const phoneDetails = await client.incomingPhoneNumbers.list({
      phoneNumber,
      limit: 1,
    });

    if (!phoneDetails || phoneDetails.length === 0) {
      logExternalApiError(
        "Twilio",
        "validate_phone_number",
        new Error(`Phone number ${phoneNumber} not found in Twilio account`),
        null,
        {
          phoneNumber,
        }
      );
      return { success: false };
    }

    logBusinessEvent("twilio_phone_validated", null, {
      phoneNumber,
      twilioSid: phoneDetails[0]?.sid,
    });
  } catch (error) {
    logExternalApiError("Twilio", "validate_phone_number", error, null, {
      phoneNumber,
    });
    return { success: false };
  }

  // Step 2: Attach to VAPI
  try {
    const vapiClient = new VapiClient({
      token: process.env.VAPI_API_KEY,
    });

    // First, try to create the phone number
    try {
      logExternalApi("VAPI", "create_phone_number", null, {
        phoneNumber,
        provider: "twilio",
      });

      const response = await vapiClient.phoneNumbers.create({
        provider: "twilio",
        number: phoneNumber,
        twilioAccountSid: sid,
        twilioAuthToken: token,
      });

      logBusinessEvent("vapi_phone_created", null, {
        phoneNumber,
        vapiNumberId: response.id,
        status: response.status,
      });

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
        logBusinessEvent("vapi_phone_already_exists", null, {
          phoneNumber,
        });

        // Fetch existing phone numbers to find the matching one
        logExternalApi("VAPI", "list_phone_numbers", null, {
          reason: "find_existing_number",
        });

        const existingNumbers = await vapiClient.phoneNumbers.list();
        const existingNumber = existingNumbers.find(
          (num) => num.number === phoneNumber && num.twilioAccountSid === sid
        );

        if (existingNumber) {
          logBusinessEvent("vapi_existing_phone_found", null, {
            phoneNumber,
            vapiNumberId: existingNumber.id,
          });

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
          logExternalApiError(
            "VAPI",
            "find_existing_phone",
            new Error(
              `Phone number ${phoneNumber} exists but couldn't be found in VAPI list`
            ),
            null,
            {
              phoneNumber,
            }
          );
          return { success: false };
        }
      } else {
        // If it's a different error, throw it
        throw createError;
      }
    }
  } catch (vapiError) {
    logExternalApiError("VAPI", "import_phone_number", vapiError, null, {
      phoneNumber,
    });
    return { success: false };
  }
};
