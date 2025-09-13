import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import logger from "@/lib/logger";
import type { NextAuthConfig } from "next-auth";

// Extend the built-in session/user types
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    emailVerified?: boolean;
    provider?: string;
    onboardingCompleted?: boolean;
    role?: string;
    permissions?: any;
    plan?: string;
    credits?: number;
    createdAt?: Date;
    updatedAt?: Date;
    shopify?: any;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      emailVerified?: boolean;
      provider?: string;
      onboardingCompleted?: boolean;
      role?: string;
      permissions?: any;
      plan?: string;
      credits?: number;
      createdAt?: Date;
      updatedAt?: Date;
      shopify?: any;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    emailVerified?: boolean;
    provider?: string;
    onboardingCompleted?: boolean;
    role?: string;
    permissions?: any;
    plan?: string;
    credits?: number;
    createdAt?: Date;
    updatedAt?: Date;
    shopify?: any;
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId:
        process.env.AUTH_GOOGLE_ID ||
        process.env.GOOGLE_ID ||
        "501217373542-nmh7lm44ublt2ge39i8jk9j9cv14rlt1.apps.googleusercontent.com",
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET ||
        process.env.GOOGLE_SECRET ||
        "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",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            logger.warn("Login attempt with missing credentials");
            throw new Error("Email and password are required");
          }

          const email = (credentials.email as string).trim().toLowerCase();
          const password = credentials.password as string;

          // Email format validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            logger.warn("Login attempt with invalid email format", { email });
            throw new Error("Invalid email format");
          }

          // Password length validation
          if (password.length < 6) {
            logger.warn("Login attempt with short password", { email });
            throw new Error("Password must be at least 6 characters");
          }

          await connectDB();

          // Find user by email
          const user = await User.findOne({ email }).lean();

          if (!user) {
            logger.warn("Login attempt with non-existent email", { email });
            throw new Error("Invalid credentials");
          }

          // Check if user is locked
          if (user.lockUntil && user.lockUntil > Date.now()) {
            logger.warn("Login attempt for locked account", { email });
            throw new Error(
              "Account is temporarily locked. Please try again later."
            );
          }

          // Check if user has password (for OAuth users)
          if (!user.password) {
            logger.warn("Login attempt for OAuth user with password", {
              email,
            });
            throw new Error("Invalid credentials");
          }

          // Verify password
          const isCorrectPassword = await bcrypt.compare(
            password,
            user.password as string
          );

          if (!isCorrectPassword) {
            // Increment login attempts
            await User.findByIdAndUpdate(user._id, {
              $inc: { loginAttempts: 1 },
              ...(user.loginAttempts >= 4 && {
                lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
              }),
            });

            logger.warn("Login attempt with incorrect password", { email });
            throw new Error("Invalid credentials");
          }

          // Reset login attempts and update last login
          await User.findByIdAndUpdate(user._id, {
            loginAttempts: 0,
            lockUntil: null,
            lastLogin: new Date(),
          });

          logger.info("User login successful", {
            email: user.email,
            userId: user._id.toString(),
            role: user.role,
            provider: user.provider,
          });

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            emailVerified: user.emailVerified,
            provider: user.provider,
            onboardingCompleted: user.onboardingCompleted,
            role: user.role,
            permissions: user.permissions,
            plan: user.plan,
            credits: user.credits,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          };
        } catch (error) {
          logger.error("Authentication error", {
            error: error.message,
            email: credentials?.email,
          });
          throw new Error(error.message);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = (user as any).id;
        token.emailVerified = (user as any).emailVerified;
        token.provider = (user as any).provider;
        token.onboardingCompleted = (user as any).onboardingCompleted;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
        token.plan = (user as any).plan;
        token.credits = (user as any).credits;
        token.createdAt = (user as any).createdAt;
        token.updatedAt = (user as any).updatedAt;
        token.shopify = (user as any).shopify;
      }

      // For existing sessions, fetch user data from database
      if (token.email) {
        try {
          await connectDB();
          const userData = await User.findOne({ email: token.email }).lean();
          if (userData) {
            token.id = userData._id.toString();
            token.emailVerified = userData.emailVerified;
            token.provider = userData.provider;
            token.onboardingCompleted = userData.onboardingCompleted;
            token.role = userData.role;
            token.permissions = userData.permissions;
            token.plan = userData.plan;
            token.credits = userData.credits;
            token.createdAt = userData.createdAt;
            token.updatedAt = userData.updatedAt;
            token.shopify = userData.shopify;
          }
        } catch (error) {
          logger.error("Error fetching user data in JWT callback", {
            error: error.message,
            email: token.email,
          });
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).emailVerified = token.emailVerified;
        (session.user as any).provider = token.provider;
        (session.user as any).onboardingCompleted = token.onboardingCompleted;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions;
        (session.user as any).plan = token.plan;
        (session.user as any).credits = token.credits;
        (session.user as any).createdAt = token.createdAt;
        (session.user as any).updatedAt = token.updatedAt;
        (session.user as any).shopify = token.shopify;
      }
      return session;
    },

    async signIn({ account, profile, user }) {
      if (account.provider === "google") {
        try {
          await connectDB();

          const userExists = await User.findOne({
            email: profile.email,
          }).lean();

          if (!userExists) {
            // Create new user from Google with default "none" plan
            const newUser = await User.create({
              email: profile.email,
              name: profile.name,
              image: profile.picture,
              emailVerified: true,
              provider: "google",
              onboardingCompleted: false,
              role: "user",
              permissions: {
                viewLogs: false,
                manageUsers: false,
                manageAdmins: false,
                viewAnalytics: false,
                systemSettings: false,
              },
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

            logger.info("New user created via Google OAuth", {
              email: newUser.email,
              userId: newUser._id.toString(),
            });

            // Return user object with ID for JWT callback
            (user as any).id = newUser._id.toString();
            (user as any).emailVerified = newUser.emailVerified;
            (user as any).provider = newUser.provider;
            (user as any).onboardingCompleted = newUser.onboardingCompleted;
            (user as any).role = newUser.role;
            (user as any).permissions = newUser.permissions;
            (user as any).plan = newUser.plan;
            (user as any).credits = newUser.credits;
            (user as any).createdAt = newUser.createdAt;
            (user as any).updatedAt = newUser.updatedAt;
          } else {
            // Update existing user's Google info
            await User.findByIdAndUpdate(userExists._id, {
              name: profile.name,
              image: profile.picture,
              emailVerified: true,
              provider: "google",
              lastLogin: new Date(),
            });

            logger.info("Existing user logged in via Google OAuth", {
              email: userExists.email,
              userId: userExists._id.toString(),
            });

            // Return user object with ID for JWT callback
            (user as any).id = userExists._id.toString();
            (user as any).emailVerified = userExists.emailVerified;
            (user as any).provider = userExists.provider;
            (user as any).onboardingCompleted = userExists.onboardingCompleted;
            (user as any).role = userExists.role;
            (user as any).permissions = userExists.permissions;
            (user as any).plan = userExists.plan;
            (user as any).credits = userExists.credits;
            (user as any).createdAt = userExists.createdAt;
            (user as any).updatedAt = userExists.updatedAt;
          }

          return true;
        } catch (error) {
          logger.error("Google sign in error", {
            error: error.message,
            email: profile.email,
          });
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
    updateAge: 60 * 60, // Update session every hour
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  debug: false, // Disable debug to reduce console noise
});
