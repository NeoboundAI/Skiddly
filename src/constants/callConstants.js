// Call outcome constants for different call statuses

// CALL_OUTCOMES_PICKED - When call status = "picked"
export const CALL_OUTCOMES_PICKED = {
  CUSTOMER_BUSY: "customer_busy",
  NOT_INTERESTED: "not_interested",
  WANTS_DISCOUNT: "wants_discount",
  WANTS_FREE_SHIPPING: "wants_free_shipping",
  RESCHEDULE_REQUEST: "reschedule_request",
  ABUSIVE_LANGUAGE: "abusive_language",
  DO_NOT_CALL_REQUEST: "do_not_call_request",
  COMPLETED_PURCHASE: "completed_purchase",
  WILL_THINK_ABOUT_IT: "will_think_about_it",
  TECHNICAL_ISSUES: "technical_issues",
  WRONG_PERSON: "wrong_person",
};

// CALL_OUTCOMES_NOT_PICKED - When call status = "not_picked"
export const CALL_OUTCOMES_NOT_PICKED = {
  CUSTOMER_BUSY_LINE: "customer_busy_line",
  CALL_DISCONNECTED: "call_disconnected",
  VOICEMAIL: "voicemail",
  NO_ANSWER: "no_answer",
  NETWORK_ERROR: "network_error",
  WRONG_NUMBER: "wrong_number",
  NUMBER_NOT_REACHABLE: "number_not_reachable",
  SWITCHED_OFF: "switched_off",
  CALL_REJECTED: "call_rejected",
};

// FINAL_ACTIONS - Actions taken by agent after the call
export const FINAL_ACTIONS = {
  SMS_SENT_WITH_DISCOUNT_CODE: "SMS_sent_with_discount_code", // 📱
  RESCHEDULE_CALL: "reschedule_call", // 📅
  LEFT_VOICEMAIL: "left_voicemail", // 📞
  MARKED_DNC: "marked_dnc", // 🚫
  ORDER_COMPLETED: "order_completed", // ✅
  SCHEDULED_RETRY: "scheduled_retry", // ⏰
  WHATSAPP_SENT: "whatsapp_sent", // 💬
  NO_ACTION_REQUIRED: "no_action_required",
};

// All call outcomes combined for validation
export const ALL_CALL_OUTCOMES = {
  ...CALL_OUTCOMES_PICKED,
  ...CALL_OUTCOMES_NOT_PICKED,
};

// All final actions for validation
export const ALL_FINAL_ACTIONS = {
  ...FINAL_ACTIONS,
};

// Call status enum
export const CALL_STATUS = {
  QUEUED: "queued",
  PICKED: "picked",
  NOT_PICKED: "not_picked",
  CALL_IN_PROGRESS: "call_in_progress",
  CALL_COMPLETED: "call_completed",
};

// Order stage enum for AbandonedCart
export const ORDER_STAGE = {
  ABANDONED: "abandoned",
  CONVERTED: "converted",
  RECOVERED: "recovered",
};

// Order queue status enum
export const ORDER_QUEUE_STATUS = {
  PENDING: "Pending",
  IN_QUEUE: "In_Queue",
  COMPLETED: "Completed",
  FAILED: "Failed",
};
