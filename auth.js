import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import logger from "@/lib/logger";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
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

          const email = credentials.email.trim().toLowerCase();
          const password = credentials.password;

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
            user.password
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
            subscription: user.subscription,
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
        token.id = user.id;
        token.emailVerified = user.emailVerified;
        token.provider = user.provider;
        token.onboardingCompleted = user.onboardingCompleted;
        token.role = user.role;
        token.permissions = user.permissions;
        token.subscription = user.subscription;
        token.createdAt = user.createdAt;
        token.updatedAt = user.updatedAt;
        token.shopify = user.shopify;
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
            token.subscription = userData.subscription;
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
        session.user.id = token.id;
        session.user.emailVerified = token.emailVerified;
        session.user.provider = token.provider;
        session.user.onboardingCompleted = token.onboardingCompleted;
        session.user.role = token.role;
        session.user.permissions = token.permissions;
        session.user.subscription = token.subscription;
        session.user.createdAt = token.createdAt;
        session.user.updatedAt = token.updatedAt;
        session.user.shopify = token.shopify;
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
            // Create new user from Google with default free_trial subscription
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
              subscription: {
                plan: "free_trial",
                status: "trialing",
                limits: {
                  monthlyCalls: 25,
                  monthlySms: 0,
                  maxAgents: 1,
                  maxStores: 1,
                  hasDedicatedNumber: false,
                  hasApiAccess: false,
                  hasMultiAgent: false,
                },
                usage: {
                  callsThisMonth: 0,
                  smsThisMonth: 0,
                  lastUsageReset: new Date(),
                },
                trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                isTrialActive: true,
                monthlyPrice: 0,
              },
              lastLogin: new Date(),
            });

            logger.info("New user created via Google OAuth", {
              email: newUser.email,
              userId: newUser._id.toString(),
            });

            // Return user object with ID for JWT callback
            user.id = newUser._id.toString();
            user.emailVerified = newUser.emailVerified;
            user.provider = newUser.provider;
            user.onboardingCompleted = newUser.onboardingCompleted;
            user.role = newUser.role;
            user.permissions = newUser.permissions;
            user.subscription = newUser.subscription;
            user.createdAt = newUser.createdAt;
            user.updatedAt = newUser.updatedAt;
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
            user.id = userExists._id.toString();
            user.emailVerified = userExists.emailVerified;
            user.provider = userExists.provider;
            user.onboardingCompleted = userExists.onboardingCompleted;
            user.role = userExists.role;
            user.permissions = userExists.permissions;
            user.subscription = userExists.subscription;
            user.createdAt = userExists.createdAt;
            user.updatedAt = userExists.updatedAt;
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
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development", // Enable debug in development
  trustHost: true, // Required for NextAuth v5
});
