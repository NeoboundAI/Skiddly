/**
 * Validation utilities for Agent Wizard steps
 * Centralized validation logic for better maintainability
 */

// Validation rules for each step
export const validationRules = {
  storeProfile: {
    supportChannels: {
      required: true,
      message: "At least one support channel is required",
      validator: (value) => value && value.length > 0,
    },
    storeDescription: {
      required: true,
      message: "Store description is required",
      validator: (value) => value && value.trim().length > 0,
    },
    storeCategory: {
      required: true,
      message: "Store category is required",
      validator: (value) => value && value !== "",
    },
    fulfillmentMethod: {
      required: true,
      message: "At least one fulfillment method is required",
      validator: (value) => value && value.length > 0,
    },
  },
  commerceSettings: {
    checkoutProviders: {
      required: true,
      message: "At least one checkout provider is required",
      validator: (value) => value?.selected && value.selected.length > 0,
    },
    cardsAccepted: {
      required: true,
      message: "At least one card type is required",
      validator: (value) => value?.selected && value.selected.length > 0,
    },
    buyNowPayLater: {
      required: true,
      message: "At least one BNPL provider is required",
      validator: (value) => value?.selected && value.selected.length > 0,
    },
    discountCategories: {
      required: true,
      message: "At least one discount category is required",
      validator: (value) => value?.selected && value.selected.length > 0,
    },
    shippingMethods: {
      required: true,
      message: "At least one shipping method is required",
      validator: (value) => value?.selected && value.selected.length > 0,
    },
  },
  callLogic: {
    conditions: {
      required: true,
      message: "At least one call condition is required",
      validator: (value) =>
        value &&
        value.length > 0 &&
        value.some((condition) => condition.enabled),
    },
    callSchedule: {
      required: true,
      message: "Call schedule configuration is required",
      validator: (value) =>
        value && value.waitTime && value.maxRetries && value.timezone,
    },
    timezone: {
      required: true,
      message: "Timezone is required",
      validator: (value) => value && value.trim().length > 0,
    },
  },
  offerEngine: {
    availableDiscounts: {
      required: false,
      message: "",
      validator: () => true,
    },
    availableOffers: {
      required: false,
      message: "",
      validator: () => true,
    },
    returnPolicy: {
      required: false,
      message: "",
      validator: () => true,
    },
  },
  agentPersona: {
    agentName: {
      required: true,
      message: "Agent name is required",
      validator: (value) => value && value.trim().length > 0,
    },
    voiceProvider: {
      required: true,
      message: "Voice provider is required",
      validator: (value) => value && value !== "",
    },
    greetingStyle: {
      required: true,
      message: "Greeting style is required",
      validator: (value) => {
        if (!value || typeof value !== "object") return false;
        // Check if at least one style is enabled
        return Object.values(value).some((style) => style.enabled === true);
      },
    },
  },
  objectionHandling: {
    // At least one objection type should be enabled
    // Check if any objection type is enabled
    enabledObjections: {
      required: true,
      message: "At least one objection type must be enabled",
      validator: (value) => {
        if (!value || typeof value !== "object") return false;
        // Check if any objection type has enabled: true
        return Object.values(value).some((obj) => obj && obj.enabled === true);
      },
    },
  },
  testLaunch: {
    connectedPhoneNumbers: {
      required: true,
      message: "Please select a phone number for your agent",
      validator: (value) => Array.isArray(value) && value.length > 0,
    },
  },
};

/**
 * Validate a specific step configuration
 * @param {string} stepName - The step name (e.g., 'storeProfile', 'commerceSettings')
 * @param {object} config - The configuration object to validate
 * @returns {object} - Object with isValid boolean and errors object
 */
export const validateStep = (stepName, config) => {
  const rules = validationRules[stepName];
  if (!rules) {
    return { isValid: true, errors: {} };
  }

  const errors = {};
  let isValid = true;

  // Validate each field according to its rules
  Object.keys(rules).forEach((fieldName) => {
    const rule = rules[fieldName];
    let fieldValue;

    // Handle nested fields like timezone within callSchedule
    if (fieldName === "timezone" && stepName === "callLogic") {
      fieldValue = config.callSchedule?.timezone;
    } else if (
      fieldName === "enabledObjections" &&
      stepName === "objectionHandling"
    ) {
      // For objection handling, check the entire config object
      fieldValue = config;
    } else {
      fieldValue = config[fieldName];
    }

    if (rule.required && !rule.validator(fieldValue)) {
      errors[fieldName] = rule.message;
      isValid = false;
    }
  });

  return { isValid, errors };
};

/**
 * Get validation errors for a specific step
 * @param {string} stepName - The step name
 * @param {object} config - The configuration object
 * @returns {object} - Errors object (empty if valid)
 */
export const getStepErrors = (stepName, config) => {
  const { errors } = validateStep(stepName, config);
  return errors;
};

/**
 * Check if a step is valid
 * @param {string} stepName - The step name
 * @param {object} config - The configuration object
 * @returns {boolean} - True if valid, false otherwise
 */
export const isStepValid = (stepName, config) => {
  const { isValid } = validateStep(stepName, config);
  return isValid;
};

/**
 * Validate all steps in the agent configuration
 * @param {object} agentConfig - The complete agent configuration
 * @returns {object} - Object with isValid boolean and stepErrors object
 */
export const validateAllSteps = (agentConfig) => {
  const stepNames = [
    "storeProfile",
    "commerceSettings",
    "callLogic",
    "offerEngine",
    "agentPersona",
    "objectionHandling",
    "testLaunch",
  ];

  const stepErrors = {};
  let allStepsValid = true;

  stepNames.forEach((stepName) => {
    const config = agentConfig[stepName];
    const { isValid, errors } = validateStep(stepName, config);

    if (!isValid) {
      stepErrors[stepName] = errors;
      allStepsValid = false;
    }
  });

  return { isValid: allStepsValid, stepErrors };
};

/**
 * Get step-specific validation messages
 * @param {string} stepName - The step name
 * @returns {object} - Object with step-specific messages
 */
export const getStepMessages = (stepName) => {
  const messages = {
    storeProfile: {
      title: "Store Profile Validation Failed",
      description:
        "Please fill in all required fields before proceeding to the next step.",
    },
    commerceSettings: {
      title: "Commerce Settings Validation Failed",
      description:
        "Please select at least one option for each required category before proceeding to the next step.",
    },
    callLogic: {
      title: "Call Logic Validation Failed",
      description:
        "Please configure at least one call condition and complete the call schedule before proceeding.",
    },
    offerEngine: {
      title: "Offer Engine Validation Failed",
      description:
        "Please complete the offer engine configuration before proceeding.",
    },
    agentPersona: {
      title: "Agent Persona Validation Failed",
      description:
        "Please configure the agent name, voice provider, and greeting style before proceeding.",
    },
    objectionHandling: {
      title: "Objection Handling Validation Failed",
      description:
        "Please enable at least one objection type before proceeding.",
    },
    testLaunch: {
      title: "Test & Launch Validation Failed",
      description:
        "Please select a phone number for your agent before making it live.",
    },
  };

  return (
    messages[stepName] || {
      title: "Validation Failed",
      description: "Please complete all required fields.",
    }
  );
};
