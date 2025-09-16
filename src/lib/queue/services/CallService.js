import { VapiClient } from "@vapi-ai/server-sdk";
import Call from "../../../models/Call.js";
import AbandonedCart from "../../../models/AbandonedCart.js";
import { CALL_STATUS, ORDER_QUEUE_STATUS } from "../../../constants/callConstants.js";
import { logBusinessEvent, logApiError } from "../../apiLogger.js";

/**
 * Call Service
 * Handles all VAPI call operations and call record management
 */
class CallService {
  constructor() {
    this.vapiClient = new VapiClient({
      token: process.env.VAPI_API_KEY,
    });
  }

  /**
   * Initiate a call using VAPI
   */
  async initiateCall(agent, cart, callQueueEntry) {
    try {
      console.log(
        `📞 Initiating call to ${cart.customerPhone} for customer: ${
          cart.customerFirstName || "Unknown"
        }`
      );

      // Get phone number configuration
      const phoneNumberConfig = agent.testLaunch?.connectedPhoneNumbers?.[0];
      
      if (!phoneNumberConfig?.vapiNumberId) {
        throw new Error(`No VAPI phone number configured for agent: ${agent._id}`);
      }

      // Format phone number
      const formattedPhoneNumber = this.formatPhoneNumber(cart.customerPhone);
      
      if (!formattedPhoneNumber) {
        throw new Error(`No valid phone number found for cart: ${cart._id}`);
      }

      // Create VAPI call
      const vapiResponse = await this.vapiClient.calls.create({
        assistantId: agent.assistantId,
        phoneNumberId: phoneNumberConfig.vapiNumberId,
        customer: {
          number: formattedPhoneNumber.startsWith("+91")
            ? formattedPhoneNumber
            : `+91${formattedPhoneNumber}`,
        },
        assistantOverrides: {
          variableValues: this.buildCallVariables(agent, cart, formattedPhoneNumber),
        },
      });

      console.log("VAPI response:", vapiResponse);
      console.log(`📞 Call initiated successfully. VAPI Call ID: ${vapiResponse.id}`);

      // Create call record in database
      const callRecord = await this.createCallRecord(vapiResponse, callQueueEntry, agent, cart, formattedPhoneNumber);

      // Update abandoned cart status
      await this.updateAbandonedCartStatus(callQueueEntry.abandonedCartId);

      // Log business event
      logBusinessEvent("call_initiated", callQueueEntry.userId, {
        callId: vapiResponse.id,
        customerNumber: formattedPhoneNumber,
        agentId: agent._id,
        cartId: cart._id,
        correlationId: callQueueEntry.correlationId,
      });

      return {
        success: true,
        callId: vapiResponse.id,
        callRecord,
      };

    } catch (error) {
      console.error(`VAPI error for call queue entry ${callQueueEntry._id}:`, error.message);
      
      // Log API error
      logApiError(
        "CALL_SERVICE",
        "vapi_call_creation",
        500,
        error,
        callQueueEntry.userId,
        {
          callQueueId: callQueueEntry._id,
          customerNumber: cart.customerPhone,
          agentId: agent._id,
        }
      );

      return {
        success: false,
        error: error.message,
        isRetryable: this.isRetryableError(error),
      };
    }
  }

  /**
   * Format phone number for VAPI
   */
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    
    let formatted = phoneNumber;
    console.log("Original phone number:", formatted);
    
    // Handle Indian phone numbers
    if (/^91\d{10}$/.test(formatted)) {
      formatted = `+${formatted}`;
    }
    
    console.log("Formatted phone number:", formatted);
    return formatted;
  }

  /**
   * Build call variables for VAPI
   */
  buildCallVariables(agent, cart, formattedPhoneNumber) {
    return {
      CustomerFirstName: cart.customerFirstName || "",
      StoreName: agent.storeProfile?.storeName || "",
      ProductNames: cart.lineItems?.map((item) => item.title).join(", ") || "",
      AgentName: agent.agentPersona?.agentName || "",
      CartValue: cart.totalPrice || "",
      Last4Digits: formattedPhoneNumber.slice(-4) || "",
      DiscountCode: "",
    };
  }

  /**
   * Create call record in database
   */
  async createCallRecord(vapiResponse, callQueueEntry, agent, cart, formattedPhoneNumber) {
    return await Call.create({
      callId: vapiResponse.id,
      userId: callQueueEntry.userId,
      abandonedCartId: callQueueEntry.abandonedCartId,
      agentId: callQueueEntry.agentId,
      cartId: callQueueEntry.cartId,
      assistantId: agent.assistantId,
      customerNumber: formattedPhoneNumber,
      callStatus: CALL_STATUS.QUEUED,
      providerEndReason: "initiated",
      endedReason: "initiated",
      cost: 0,
      duration: 0,
      picked: false,
      vapiCallId: vapiResponse.id,
      correlationId: callQueueEntry.correlationId,
      createdAt: vapiResponse.createdAt,
      updatedAt: vapiResponse.updatedAt,
    });
  }

  /**
   * Update abandoned cart status after call initiation
   */
  async updateAbandonedCartStatus(abandonedCartId) {
    await AbandonedCart.findByIdAndUpdate(abandonedCartId, {
      lastCallStatus: CALL_STATUS.QUEUED,
      orderQueueStatus: ORDER_QUEUE_STATUS.IN_QUEUE,
      lastAttemptTime: new Date(),
    });
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    const retryableErrors = [
      "rate limit",
      "busy",
      "timeout",
      "network error",
      "service unavailable"
    ];
    
    return retryableErrors.some(retryableError => 
      error.message.toLowerCase().includes(retryableError)
    );
  }

  /**
   * Get call status from VAPI
   */
  async getCallStatus(callId) {
    try {
      const call = await this.vapiClient.calls.get(callId);
      return {
        success: true,
        call,
      };
    } catch (error) {
      console.error(`Error fetching call status for ${callId}:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cancel a call
   */
  async cancelCall(callId) {
    try {
      await this.vapiClient.calls.cancel(callId);
      console.log(`📞 Call ${callId} cancelled successfully`);
      return { success: true };
    } catch (error) {
      console.error(`Error cancelling call ${callId}:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get call recording URL
   */
  async getCallRecording(callId) {
    try {
      const call = await this.vapiClient.calls.get(callId);
      return {
        success: true,
        recordingUrl: call.recordingUrl,
      };
    } catch (error) {
      console.error(`Error fetching recording for call ${callId}:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
const callService = new CallService();
export default callService;
