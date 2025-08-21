const mongoose = require("mongoose");

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Use a default MongoDB URI for testing - replace with your actual URI
    const MONGODB_URI =
      "mongodb+srv://admin:sanjeev9021@skiddly.76lutjy.mongodb.net/skiddly-dev";
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

// Define the schema
const defaultAgentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["abandoned-cart", "customer-support", "custom"],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    languages: {
      type: String,
      default: "Hindi / English",
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    assistantId: {
      type: String,
      required: true, // VAPI assistant ID to fetch configuration from
    },
    // Default configuration template
    defaultConfiguration: {
      language: {
        type: String,
        default: "en-US",
      },
      voiceStyle: {
        type: String,
        default: "professional-female",
      },
      greeting: {
        type: String,
        default: "standard",
      },
      returnPolicy: {
        type: String,
        default: "30 days",
      },
      callTriggers: {
        abandonedCart: {
          type: Boolean,
          default: true,
        },
        waitTime: {
          type: String,
          default: "2",
        },
        waitTimeUnit: {
          type: String,
          default: "hours",
        },
      },
      callSettings: {
        maxRetries: {
          type: String,
          default: "3",
        },
        retryInterval: {
          type: String,
          default: "24",
        },
        retryIntervalUnit: {
          type: String,
          default: "hours",
        },
        weekendCalling: {
          type: Boolean,
          default: false,
        },
        callTimeStart: {
          type: String,
          default: "09:00",
        },
        callTimeEnd: {
          type: String,
          default: "18:00",
        },
        timezone: {
          type: String,
          default: "America/New_York",
        },
        respectDND: {
          type: Boolean,
          default: true,
        },
        voicemailDetection: {
          type: Boolean,
          default: true,
        },
      },
      objectionHandling: {
        shipping: {
          type: Boolean,
          default: true,
        },
        price: {
          type: Boolean,
          default: true,
        },
        size: {
          type: Boolean,
          default: true,
        },
        payment: {
          type: Boolean,
          default: true,
        },
        technical: {
          type: Boolean,
          default: true,
        },
        comparison: {
          type: Boolean,
          default: true,
        },
        forgot: {
          type: Boolean,
          default: true,
        },
      },
      enableSmartEscalation: {
        type: Boolean,
        default: false,
      },
      enableFollowUp: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
defaultAgentSchema.index({ type: 1, enabled: 1 });
defaultAgentSchema.index({ assistantId: 1 });

const DefaultAgent =
  mongoose.models.DefaultAgent ||
  mongoose.model("DefaultAgent", defaultAgentSchema);

const defaultAgents = [
  {
    name: "Abandoned checkout agent",
    description:
      "Calls customers who abandoned their shopping cart to recover sales",
    type: "abandoned-cart",
    category: "Ecommerce",
    languages: "Hindi / English",
    enabled: true,
    assistantId: "9cdf5efc-e59d-450d-a6db-a0d9b26fece4", // Actual VAPI assistant ID
    defaultConfiguration: {
      language: "en-US",
      voiceStyle: "professional-female",
      greeting: "standard",
      returnPolicy: "30 days",
      callTriggers: {
        abandonedCart: true,
        waitTime: "2",
        waitTimeUnit: "hours",
      },
      callSettings: {
        maxRetries: "3",
        retryInterval: "24",
        retryIntervalUnit: "hours",
        weekendCalling: false,
        callTimeStart: "09:00",
        callTimeEnd: "18:00",
        timezone: "America/New_York",
        respectDND: true,
        voicemailDetection: true,
      },
      objectionHandling: {
        shipping: true,
        price: true,
        size: true,
        payment: true,
        technical: true,
        comparison: true,
        forgot: true,
      },
      enableSmartEscalation: false,
      enableFollowUp: false,
    },
  },
  {
    name: "Customer support agent",
    description: "Handles customer inquiries and provides support",
    type: "customer-support",
    category: "Ecommerce",
    languages: "Hindi / English",
    enabled: true,
    assistantId: "customer-support-template", // Replace with actual VAPI assistant ID
    defaultConfiguration: {
      language: "en-US",
      voiceStyle: "professional-female",
      greeting: "standard",
      returnPolicy: "30 days",
      callTriggers: {
        abandonedCart: false,
        waitTime: "0",
        waitTimeUnit: "hours",
      },
      callSettings: {
        maxRetries: "1",
        retryInterval: "0",
        retryIntervalUnit: "hours",
        weekendCalling: true,
        callTimeStart: "08:00",
        callTimeEnd: "20:00",
        timezone: "America/New_York",
        respectDND: true,
        voicemailDetection: true,
      },
      objectionHandling: {
        shipping: true,
        price: true,
        size: true,
        payment: true,
        technical: true,
        comparison: true,
        forgot: true,
      },
      enableSmartEscalation: true,
      enableFollowUp: true,
    },
  },
];

async function seedDefaultAgents() {
  try {
    await connectDB();

    console.log("Starting to seed default agents...");

    for (const agentData of defaultAgents) {
      // Check if agent already exists
      const existingAgent = await DefaultAgent.findOne({
        assistantId: agentData.assistantId,
      });

      if (existingAgent) {
        console.log(
          `Agent with assistantId ${agentData.assistantId} already exists, skipping...`
        );
        continue;
      }

      // Create new default agent
      const agent = new DefaultAgent(agentData);
      await agent.save();

      console.log(`Created default agent: ${agentData.name}`);
    }

    console.log("Default agents seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding default agents:", error);
    process.exit(1);
  }
}

// Run the seeding function
seedDefaultAgents();
