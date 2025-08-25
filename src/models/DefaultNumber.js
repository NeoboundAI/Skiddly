import mongoose from "mongoose";

const defaultNumberSchema = new mongoose.Schema(
  {
    // Core Twilio fields
    account_sid: {
      type: String,
      required: true,
    },
    phone_number: {
      type: String,
      required: true,
      unique: true,
    },
    friendly_name: {
      type: String,
      required: true,
    },
    sid: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["in-use", "available", "inactive"],
      default: "available",
    },

    // Address and location fields
    address_requirements: {
      type: String,
      default: "none",
    },
    address_sid: {
      type: String,
      default: null,
    },
    emergency_address_sid: {
      type: String,
      default: null,
    },
    emergency_address_status: {
      type: String,
      default: "unregistered",
    },
    emergency_status: {
      type: String,
      default: "Active",
    },

    // API and version fields
    api_version: {
      type: String,
      default: "2010-04-01",
    },
    beta: {
      type: Boolean,
      default: false,
    },
    bundle_sid: {
      type: String,
      default: null,
    },
    capabilities: {
      type: Object,
      default: {},
    },
    identity_sid: {
      type: String,
      default: null,
    },
    origin: {
      type: String,
      default: "twilio",
    },
    trunk_sid: {
      type: String,
      default: null,
    },

    // SMS configuration
    sms_application_sid: {
      type: String,
      default: "",
    },
    sms_fallback_method: {
      type: String,
      default: "POST",
    },
    sms_fallback_url: {
      type: String,
      default: null,
    },
    sms_method: {
      type: String,
      default: "POST",
    },
    sms_url: {
      type: String,
      default: "https://api.vapi.ai/twilio/sms",
    },

    // Voice configuration
    voice_application_sid: {
      type: String,
      default: null,
    },
    voice_caller_id_lookup: {
      type: Boolean,
      default: false,
    },
    voice_fallback_method: {
      type: String,
      default: "POST",
    },
    voice_fallback_url: {
      type: String,
      default: null,
    },
    voice_method: {
      type: String,
      default: "POST",
    },
    voice_receive_mode: {
      type: String,
      default: "voice",
    },
    voice_url: {
      type: String,
      default: "https://api.vapi.ai/twilio/inbound_call",
    },

    // Status callback configuration
    status_callback: {
      type: String,
      default: "https://api.vapi.ai/twilio/status",
    },
    status_callback_method: {
      type: String,
      default: "POST",
    },

    // URI fields
    uri: {
      type: String,
      required: true,
    },
    subresource_uris: {
      type: Object,
      default: {},
    },

    // Timestamps
    date_created: {
      type: String,
      required: true,
    },
    date_updated: {
      type: String,
      required: true,
    },

    // VAPI Integration fields
    vapiNumberId: {
      type: String,
      required: true,
    },
    vapiOrgId: {
      type: String,
      required: true,
    },
    vapiStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    // Shared number tracking (optional - for analytics)
    totalAssignments: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
defaultNumberSchema.index({ isActive: 1, vapiStatus: 1 });
defaultNumberSchema.index({ phone_number: 1 });

const DefaultNumber =
  mongoose.models.DefaultNumber ||
  mongoose.model("DefaultNumber", defaultNumberSchema);

export default DefaultNumber;
