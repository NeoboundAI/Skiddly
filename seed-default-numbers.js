const mongoose = require("mongoose");

// PUT YOUR MONGODB URI HERE
const MONGODB_URI =
  "mongodb+srv://admin:sanjeev9021@skiddly.76lutjy.mongodb.net/skiddly-dev";

// Define the schema
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

const DefaultNumber = mongoose.model("DefaultNumber", defaultNumberSchema);

const defaultNumbersData = [
  {
    account_sid: "AC9a4c5b44d4791e6a186fa8ad2d87fbab",
    address_requirements: "none",
    address_sid: null,
    api_version: "2010-04-01",
    beta: false,
    bundle_sid: null,
    capabilities: {},
    date_created: "Tue, 19 Aug 2025 14:21:36 +0000",
    date_updated: "Tue, 19 Aug 2025 17:42:00 +0000",
    emergency_address_sid: null,
    emergency_address_status: "unregistered",
    emergency_status: "Active",
    friendly_name: "(850) 605-8429",
    identity_sid: null,
    origin: "twilio",
    phone_number: "+18506058429",
    sid: "PNa0e5afb258c2d97d53aca7be8d30543f",
    sms_application_sid: "",
    sms_fallback_method: "POST",
    sms_fallback_url: null,
    sms_method: "POST",
    sms_url: "https://api.vapi.ai/twilio/sms",
    status: "in-use",
    status_callback: "https://api.vapi.ai/twilio/status",
    status_callback_method: "POST",
    subresource_uris: {},
    trunk_sid: null,
    uri: "/2010-04-01/Accounts/AC9a4c5b44d4791e6a186fa8ad2d87fbab/IncomingPhoneNumbers/PNa0e5afb258c2d97d53aca7be8d30543f.json",
    voice_application_sid: null,
    voice_caller_id_lookup: false,
    voice_fallback_method: "POST",
    voice_fallback_url: null,
    voice_method: "POST",
    voice_receive_mode: "voice",
    voice_url: "https://api.vapi.ai/twilio/inbound_call",
    vapiNumberId: "de337f4a-c654-498c-b475-f732f72ef0f8",
    vapiOrgId: "YOUR_VAPI_ORG_ID",
    vapiStatus: "active",
    totalAssignments: 0,
    isActive: true,
  },
  {
    account_sid: "AC9a4c5b44d4791e6a186fa8ad2d87fbab",
    address_requirements: "none",
    address_sid: null,
    api_version: "2010-04-01",
    beta: false,
    bundle_sid: null,
    capabilities: {},
    date_created: "Fri, 15 Aug 2025 16:20:14 +0000",
    date_updated: "Fri, 15 Aug 2025 16:51:10 +0000",
    emergency_address_sid: null,
    emergency_address_status: "unregistered",
    emergency_status: "Active",
    friendly_name: "(507) 639-0345",
    identity_sid: null,
    origin: "twilio",
    phone_number: "+15076390345",
    sid: "PNd2adb8558ff90b1733fa726e73dd38a6",
    sms_application_sid: "",
    sms_fallback_method: "POST",
    sms_fallback_url: null,
    sms_method: "POST",
    sms_url: "https://api.vapi.ai/twilio/sms",
    status: "in-use",
    status_callback: "https://api.vapi.ai/twilio/status",
    status_callback_method: "POST",
    subresource_uris: {},
    trunk_sid: null,
    uri: "/2010-04-01/Accounts/AC9a4c5b44d4791e6a186fa8ad2d87fbab/IncomingPhoneNumbers/PNd2adb8558ff90b1733fa726e73dd38a6.json",
    voice_application_sid: null,
    voice_caller_id_lookup: false,
    voice_fallback_method: "POST",
    voice_fallback_url: null,
    voice_method: "POST",
    voice_receive_mode: "voice",
    voice_url: "https://api.vapi.ai/twilio/inbound_call",
    vapiNumberId: "febfa8da-4a20-47c6-90c2-2dc3fa0cc892",
    vapiOrgId: "YOUR_VAPI_ORG_ID",
    vapiStatus: "active",
    totalAssignments: 0,
    isActive: true,
  },
];

async function seedDefaultNumbers() {
  try {
    if (MONGODB_URI === "YOUR_MONGODB_URI_HERE") {
      console.error("❌ Please update the MONGODB_URI in the script first!");
      process.exit(1);
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // First, let's clean up any existing data that might cause conflicts
    console.log("🧹 Cleaning up existing data...");

    // Drop the collection to start fresh (this will remove all existing data)
    try {
      await mongoose.connection.db.dropCollection("defaultnumbers");
      console.log("✅ Dropped existing collection");
    } catch (error) {
      console.log("ℹ️  Collection doesn't exist or already dropped");
    }

    // Insert new numbers
    console.log("📞 Inserting new numbers...");
    const result = await DefaultNumber.insertMany(defaultNumbersData);
    console.log(`✅ Successfully seeded ${result.length} default numbers`);

    // Fetch and display all available numbers
    const allNumbers = await DefaultNumber.find({ isActive: true });
    console.log("\n📋 All available numbers in database:");
    allNumbers.forEach((number) => {
      console.log(
        `   - ${number.phone_number} (${number.friendly_name}) - Status: ${number.status} - Shared: Yes`
      );
    });

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding default numbers:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the seeding function
seedDefaultNumbers();
