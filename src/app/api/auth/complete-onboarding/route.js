import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import {
  logApiError,
  logApiSuccess,
  logAuthFailure,
  logDbOperation,
  logBusinessEvent,
} from "@/lib/apiLogger";

// Define authOptions locally since it's not exported from the NextAuth route
const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required");
          }

          const email = credentials.email.trim().toLowerCase();
          const password = credentials.password;

          // Email format validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            throw new Error("Invalid email format");
          }

          // Password length validation
          if (password.length < 6) {
            throw new Error("Password must be at least 6 characters");
          }

          await connectDB();

          // Find user by email
          const user = await User.findOne({ email });

          if (!user) {
            throw new Error("Invalid credentials");
          }

          // Check if user has password (for OAuth users)
          if (!user.password) {
            throw new Error("Invalid credentials");
          }

          // Verify password
          const isCorrectPassword = await bcrypt.compare(
            password,
            user.password
          );

          if (!isCorrectPassword) {
            throw new Error("Invalid credentials");
          }

          // Update last login
          await User.findByIdAndUpdate(user._id, {
            lastLogin: new Date(),
          });

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            emailVerified: user.emailVerified,
            provider: user.provider,
            onboardingCompleted: user.onboardingCompleted,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          };
        } catch (error) {
          console.error("Auth error:", error.message);
          throw new Error(error.message);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.emailVerified = user.emailVerified;
        token.provider = user.provider;
        token.onboardingCompleted = user.onboardingCompleted;
        token.plan = user.plan;
        token.credits = user.credits;
        token.createdAt = user.createdAt;
        token.updatedAt = user.updatedAt;
      }

      // For existing sessions, fetch user data from database
      if (token.email && !token.onboardingCompleted) {
        try {
          await connectDB();
          const userData = await User.findOne({ email: token.email });
          if (userData) {
            token.id = userData._id.toString();
            token.emailVerified = userData.emailVerified;
            token.provider = userData.provider;
            token.onboardingCompleted = userData.onboardingCompleted;
            token.plan = userData.plan;
            token.credits = userData.credits;
            token.createdAt = userData.createdAt;
            token.updatedAt = userData.updatedAt;
          }
        } catch (error) {
          console.error("Error fetching user data in JWT callback:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.emailVerified = token.emailVerified;
        session.user.provider = token.provider;
        session.user.onboardingCompleted = token.onboardingCompleted;
        session.user.plan = token.plan;
        session.user.credits = token.credits;
        session.user.createdAt = token.createdAt;
        session.user.updatedAt = token.updatedAt;
      }
      return session;
    },
    async signIn({ account, profile }) {
      if (account.provider === "google") {
        try {
          await connectDB();

          const userExists = await User.findOne({ email: profile.email });

          if (!userExists) {
            // Create new user from Google with default "none" plan
            await User.create({
              email: profile.email,
              name: profile.name,
              image: profile.picture,
              emailVerified: true,
              provider: "google",
              onboardingCompleted: false,
              plan: "none",
              credits: 0,
              planDetails: {
                totalCredits: 0,
                agentCreationLimit: 0,
                dataRetentionDays: 0,
                monthlyActiveUsers: 0,
              },
              lastLogin: new Date(),
            });
          } else {
            // Update existing user's Google info
            await User.findByIdAndUpdate(userExists._id, {
              name: profile.name,
              image: profile.picture,
              emailVerified: true,
              provider: "google",
              lastLogin: new Date(),
            });
          }

          return true;
        } catch (error) {
          console.error("Google sign in error:", error);
          return false;
        }
      }

      return true;
    },
  },
  pages: {
    signIn: "/auth",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      logAuthFailure(
        "POST",
        "/api/auth/complete-onboarding",
        null,
        "No session"
      );
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Update user's onboarding status
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        onboardingCompleted: true,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) {
      logApiError(
        "POST",
        "/api/auth/complete-onboarding",
        404,
        new Error("User not found"),
        session.user.id
      );
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    logDbOperation("update", "User", session.user.id, {
      operation: "complete_onboarding",
      previousStatus: false,
      newStatus: true,
    });

    logBusinessEvent("onboarding_completed", session.user.id, {
      email: updatedUser.email,
      provider: updatedUser.provider,
    });

    logApiSuccess(
      "POST",
      "/api/auth/complete-onboarding",
      200,
      session.user.id,
      {
        email: updatedUser.email,
      }
    );

    return NextResponse.json(
      {
        message: "Onboarding completed successfully",
        user: {
          id: updatedUser._id.toString(),
          email: updatedUser.email,
          name: updatedUser.name,
          image: updatedUser.image,
          emailVerified: updatedUser.emailVerified,
          provider: updatedUser.provider,
          onboardingCompleted: updatedUser.onboardingCompleted,
          plan: updatedUser.plan,
          credits: updatedUser.credits,
          planDetails: updatedUser.planDetails,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logApiError(
      "POST",
      "/api/auth/complete-onboarding",
      500,
      error,
      session?.user?.id
    );
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
