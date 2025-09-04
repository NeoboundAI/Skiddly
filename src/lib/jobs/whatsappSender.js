import { agenda } from "../agenda.js";
import AbandonedCart from "../../models/AbandonedCart.js";
import { logBusinessEvent, logApiError, logExternalApi } from "../apiLogger.js";
// import twilio from "twilio"; // You'll need to install and configure this

// Mock Twilio client for now
const mockTwilioClient = {
  messages: {
    async create(options) {
      return {
        sid: `mock_msg_${Date.now()}`,
        status: "sent",
        to: options.to,
        body: options.body,
      };
    },
  },
};

// Job: Send WhatsApp message to customer
agenda.define("send-whatsapp", async (job) => {
  const { abandonedCartId, customerPhone, messageContent, correlationId } =
    job.attrs.data;

  try {
    logBusinessEvent("job_started", correlationId, {
      jobType: "send-whatsapp",
      abandonedCartId,
      customerPhone: customerPhone?.slice(-4), // Log only last 4 digits
    });

    // Find the abandoned cart
    const abandonedCart = await AbandonedCart.findById(abandonedCartId);
    if (!abandonedCart) {
      throw new Error("Abandoned cart not found");
    }

    // Validate phone number
    if (!customerPhone) {
      throw new Error("Customer phone number not provided");
    }

    // Format phone number for WhatsApp (must include country code)
    const formattedPhone = formatPhoneForWhatsApp(customerPhone);

    logExternalApi("TWILIO_WHATSAPP", "send_message", correlationId, {
      to: formattedPhone,
      messageLength: messageContent.length,
    });

    // Send WhatsApp message via Twilio
    const twilioResponse = await mockTwilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedPhone}`,
      body: messageContent,
    });

    // Update abandoned cart with WhatsApp details
    await abandonedCart.sendWhatsAppDetails(
      twilioResponse.sid,
      messageContent,
      correlationId
    );

    logBusinessEvent("whatsapp_sent", correlationId, {
      messageId: twilioResponse.sid,
      status: twilioResponse.status,
      customerPhone: formattedPhone.slice(-4),
    });

    logBusinessEvent("job_completed", correlationId, {
      jobType: "send-whatsapp",
      messageId: twilioResponse.sid,
      abandonedCartId,
    });
  } catch (error) {
    // Update abandoned cart with failure
    try {
      const abandonedCart = await AbandonedCart.findById(abandonedCartId);
      if (abandonedCart) {
        abandonedCart.whatsappDetails.sent = false;
        abandonedCart.whatsappDetails.deliveryStatus = "failed";
        await abandonedCart.save();
      }
    } catch (updateError) {
      logApiError(
        "WHATSAPP",
        "update_failure",
        500,
        updateError,
        correlationId
      );
    }

    logApiError("JOB", "send-whatsapp", 500, error, correlationId, {
      abandonedCartId,
      customerPhone: customerPhone?.slice(-4),
    });
    throw error;
  }
});

// Helper function to format phone number for WhatsApp
function formatPhoneForWhatsApp(phone) {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // Add country code if not present
  if (!cleaned.startsWith("1") && cleaned.length === 10) {
    cleaned = "1" + cleaned; // Assume US number
  }

  return `+${cleaned}`;
}
