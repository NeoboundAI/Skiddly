// Note: No longer importing models since we use populated data from callQueueEntry

/**
 * Validation Service
 * Handles data validation for call processing
 */
class ValidationService {
  /**
   * Validate call queue entry data
   */
  async validateCallQueueEntry(agent, cart, abandonedCart) {
    console.log("Validating data:", {
      agent: agent?._id,
      cart: cart?._id,
      abandonedCart: abandonedCart?._id,
    });
    try {
      const validation = {
        isValid: true,
        errors: [],
        data: { agent, cart, abandonedCart },
      };

      // Validate agent
      if (!agent) {
        validation.isValid = false;
        validation.errors.push("Agent not found");
      } else if (!agent.testLaunch?.isLive) {
        validation.isValid = false;
        validation.errors.push("Agent is not live");
      }

      // Validate cart
      if (!cart) {
        validation.isValid = false;
        validation.errors.push("Cart not found");
      } else if (!cart.customerPhone && !cart.smsMarketingPhone) {
        validation.isValid = false;
        validation.errors.push(
          "No phone number found in cart (customerPhone or smsMarketingPhone)"
        );
      }

      // Validate abandoned cart
      if (!abandonedCart) {
        validation.isValid = false;
        validation.errors.push("Abandoned cart not found");
      }

      return validation;
    } catch (error) {
      console.error("Error validating call queue entry:", error.message);
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        data: null,
      };
    }
  }

  /**
   * Validate agent configuration
   */
  validateAgentConfiguration(agent) {
    const errors = [];

    // Check if agent has assistant ID
    if (!agent.assistantId) {
      errors.push("Agent missing assistant ID");
    }

    // Check if agent has phone number configuration
    const phoneNumberConfig = agent.testLaunch?.connectedPhoneNumbers?.[0];
    if (!phoneNumberConfig?.vapiNumberId) {
      errors.push("No VAPI phone number configured");
    }

    // Check if agent is live
    if (!agent.testLaunch?.isLive) {
      errors.push("Agent is not live");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate cart data
   */
  validateCartData(cart) {
    const errors = [];

    // Check if cart has customer phone or SMS marketing phone
    if (!cart.customerPhone && !cart.smsMarketingPhone) {
      errors.push(
        "Cart missing customer phone number (customerPhone or smsMarketingPhone)"
      );
    }

    // Check if cart has total price
    if (!cart.totalPrice || cart.totalPrice <= 0) {
      errors.push("Cart missing or invalid total price");
    }

    // Check if cart has line items
    if (!cart.lineItems || cart.lineItems.length === 0) {
      errors.push("Cart missing line items");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get the best available phone number from cart
   * Priority: customerPhone > smsMarketingPhone
   */
  getCartPhoneNumber(cart) {
    if (cart.customerPhone) {
      return cart.customerPhone;
    }
    if (cart.smsMarketingPhone) {
      return cart.smsMarketingPhone;
    }
    return null;
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) {
      return {
        isValid: false,
        error: "Phone number is required",
        formatted: null,
      };
    }

    // Remove any non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, "");

    // Handle different formats
    if (cleaned.startsWith("+91")) {
      // Already formatted correctly
      return {
        isValid: true,
        error: null,
        formatted: cleaned,
      };
    } else if (cleaned.startsWith("91") && cleaned.length === 12) {
      // Add + prefix
      return {
        isValid: true,
        error: null,
        formatted: `+${cleaned}`,
      };
    } else if (cleaned.length === 10) {
      // Assume Indian number, add +91
      return {
        isValid: true,
        error: null,
        formatted: `+91${cleaned}`,
      };
    } else {
      return {
        isValid: false,
        error: "Invalid phone number format",
        formatted: null,
      };
    }
  }

  /**
   * Validate call variables
   */
  validateCallVariables(variables) {
    const errors = [];
    const requiredFields = [
      "CustomerFirstName",
      "StoreName",
      "ProductNames",
      "AgentName",
      "CartValue",
    ];

    for (const field of requiredFields) {
      if (!variables[field]) {
        errors.push(`Missing required variable: ${field}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate VAPI response
   */
  validateVapiResponse(response) {
    const errors = [];

    if (!response) {
      errors.push("VAPI response is null or undefined");
      return { isValid: false, errors };
    }

    if (!response.id) {
      errors.push("VAPI response missing call ID");
    }

    if (!response.createdAt) {
      errors.push("VAPI response missing creation timestamp");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate retry parameters
   */
  validateRetryParameters(delayMinutes) {
    const errors = [];

    if (typeof delayMinutes !== "number") {
      errors.push("Delay minutes must be a number");
    } else if (delayMinutes < 1) {
      errors.push("Delay minutes must be at least 1");
    } else if (delayMinutes > 1440) {
      // 24 hours
      errors.push("Delay minutes cannot exceed 1440 (24 hours)");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
const validationService = new ValidationService();
export default validationService;
