import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Connect to MongoDB
const connectDB = async () => {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI ||
      "mongodb+srv://admin:sanjeev9021@skiddly.76lutjy.mongodb.net/skiddly-dev";
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

// Define the User schema for the seed script
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
    },
    password: {
      type: String,
    },
    image: {
      type: String,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin", "super_admin"],
      default: "user",
    },
    permissions: {
      viewLogs: { type: Boolean, default: false },
      manageUsers: { type: Boolean, default: false },
      manageAdmins: { type: Boolean, default: false },
      viewAnalytics: { type: Boolean, default: false },
      systemSettings: { type: Boolean, default: false },
    },
    otp: {
      code: String,
      expiresAt: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    provider: {
      type: String,
      default: "credentials",
    },
    plan: {
      type: String,
      enum: ["none", "free", "infrasonic", "ultrasonic"],
      default: "none",
    },
    credits: {
      type: Number,
      default: 0,
    },
    planDetails: {
      totalCredits: { type: Number, default: 0 },
      agentCreationLimit: { type: Number, default: 0 },
      dataRetentionDays: { type: Number, default: 0 },
      monthlyActiveUsers: { type: Number, default: 0 },
      planStartDate: { type: Date },
      planEndDate: { type: Date },
    },
    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

const seedDefaultAdmin = async () => {
  try {
    await connectDB();
    console.log("Starting admin seeding process...");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@skiddly.ai" });

    if (existingAdmin) {
      console.log("Default admin already exists, updating permissions...");

      // Update existing user to be admin
      await User.findByIdAndUpdate(existingAdmin._id, {
        role: "super_admin",
        permissions: {
          viewLogs: true,
          manageUsers: true,
          manageAdmins: true,
          viewAnalytics: true,
          systemSettings: true,
        },
      });

      console.log("✅ Existing user updated to super admin!");
      console.log("Email: admin@skiddly.ai");
      console.log("Use your existing password to login");
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash("admin123456", 12);

      const defaultAdmin = await User.create({
        name: "Super Admin",
        email: "admin@skiddly.ai",
        password: hashedPassword,
        role: "super_admin",
        permissions: {
          viewLogs: true,
          manageUsers: true,
          manageAdmins: true,
          viewAnalytics: true,
          systemSettings: true,
        },
        emailVerified: true,
        onboardingCompleted: true,
        plan: "ultrasonic",
        credits: 999999,
      });

      console.log("✅ Default admin created successfully!");
      console.log("Email: admin@skiddly.ai");
      console.log("Password: admin123456");
      console.log("⚠️  Please change the password after first login!");
    }
  } catch (error) {
    console.error("❌ Error creating default admin:", error.message);
    console.error("Stack trace:", error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedDefaultAdmin();
