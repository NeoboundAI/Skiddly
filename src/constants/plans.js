// Plan configurations for Skiddly.ai
export const PLAN_CONFIGS = {
  free_trial: {
    name: "Free Trial",
    duration: 7, // days
    abandonedCalls: 25,
    abandonedSms: 0,
    maxAgents: 1,
    maxStores: 1,
    hasDedicatedNumber: false,
    hasApiAccess: false,
    hasMultiAgent: false,
    monthlyPrice: 0,
    currency: "USD",
    billingType: "trial",
  },

  starter: {
    name: "Starter",
    abandonedCalls: 75,
    abandonedSms: 0,
    maxAgents: 1,
    maxStores: 1,
    hasDedicatedNumber: true,
    hasApiAccess: false,
    hasMultiAgent: false,
    monthlyPrice: 49,
    currency: "USD",
    billingType: "fixed_schedule_fixed_amount",
  },

  growth: {
    name: "Growth",
    abandonedCalls: 250,
    abandonedSms: 0,
    maxAgents: 3,
    maxStores: 3,
    hasDedicatedNumber: true,
    hasApiAccess: false,
    hasMultiAgent: false,
    monthlyPrice: 149,
    currency: "USD",
    billingType: "fixed_schedule_fixed_amount",
  },

  scale: {
    name: "Scale",
    abandonedCalls: 1000,
    abandonedSms: 0,
    maxAgents: 10,
    maxStores: 10,
    hasDedicatedNumber: true,
    hasApiAccess: true,
    hasMultiAgent: true,
    monthlyPrice: 399,
    currency: "USD",
    billingType: "fixed_schedule_fixed_amount",
  },

  enterprise: {
    name: "Enterprise",
    abandonedCalls: -1, // unlimited
    abandonedSms: -1, // unlimited
    maxAgents: -1, // unlimited
    maxStores: -1, // unlimited
    hasDedicatedNumber: true,
    hasApiAccess: true,
    hasMultiAgent: true,
    monthlyPrice: 0, // custom
    successBasedRate: 0.025, // 2.5%
    currency: "USD",
    billingType: "fixed_schedule_variable_amount",
  },
};

// Razorpay plan IDs (to be created in Razorpay dashboard)
export const RAZORPAY_PLAN_IDS = {
  starter: "plan_starter_monthly",
  growth: "plan_growth_monthly",
  scale: "plan_scale_monthly",
  enterprise: "plan_enterprise_custom",
};

// Billing intervals
export const BILLING_INTERVALS = {
  monthly: "monthly",
  yearly: "yearly",
};

// Subscription statuses
export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  TRIALING: "trialing",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  PAUSED: "paused",
  EXPIRED: "expired",
};
