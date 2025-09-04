import { v4 as uuidv4 } from "uuid";

/**
 * Generate correlation IDs for end-to-end tracing
 */

// Generate a correlation ID for cart operations
export function generateCorrelationId(type, identifier, sequence = null) {
  const timestamp = Date.now();
  const shortUuid = uuidv4().split("-")[0]; // First segment of UUID

  if (sequence !== null) {
    return `${type}_${identifier}_${sequence}_${timestamp}_${shortUuid}`;
  }

  return `${type}_${identifier}_${timestamp}_${shortUuid}`;
}

// Generate correlation ID for webhook processing
export function generateWebhookCorrelationId(topic, shopifyCheckoutId) {
  return generateCorrelationId("webhook", `${topic}_${shopifyCheckoutId}`);
}

// Generate correlation ID for abandoned cart processing
export function generateAbandonedCartCorrelationId(shopifyCheckoutId) {
  return generateCorrelationId("abandoned", shopifyCheckoutId);
}

// Generate correlation ID for call attempts
export function generateCallCorrelationId(shopifyCheckoutId, attemptNumber) {
  return generateCorrelationId("call", shopifyCheckoutId, attemptNumber);
}

// Generate correlation ID for VAPI webhook processing
export function generateVapiCorrelationId(vapiCallId, event) {
  return generateCorrelationId("vapi", `${vapiCallId}_${event}`);
}

// Generate correlation ID for transcription processing
export function generateTranscriptionCorrelationId(
  abandonedCartId,
  attemptNumber
) {
  return generateCorrelationId("transcription", abandonedCartId, attemptNumber);
}

// Generate correlation ID for WhatsApp operations
export function generateWhatsAppCorrelationId(abandonedCartId) {
  return generateCorrelationId("whatsapp", abandonedCartId);
}

// Extract information from correlation ID
export function parseCorrelationId(correlationId) {
  const parts = correlationId.split("_");

  if (parts.length < 4) {
    return null;
  }

  return {
    type: parts[0],
    identifier: parts[1],
    sequence: parts.length > 4 ? parts[2] : null,
    timestamp: parseInt(parts[parts.length - 2]),
    uuid: parts[parts.length - 1],
  };
}

// Validate correlation ID format
export function isValidCorrelationId(correlationId) {
  if (!correlationId || typeof correlationId !== "string") {
    return false;
  }

  const parsed = parseCorrelationId(correlationId);
  return parsed !== null && !isNaN(parsed.timestamp);
}

// Create user-specific correlation context for logging
export function createUserCorrelationContext(userId, correlationId) {
  return {
    userId,
    correlationId,
    timestamp: new Date().toISOString(),
  };
}

export default {
  generateCorrelationId,
  generateWebhookCorrelationId,
  generateAbandonedCartCorrelationId,
  generateCallCorrelationId,
  generateVapiCorrelationId,
  generateTranscriptionCorrelationId,
  generateWhatsAppCorrelationId,
  parseCorrelationId,
  isValidCorrelationId,
  createUserCorrelationContext,
};
