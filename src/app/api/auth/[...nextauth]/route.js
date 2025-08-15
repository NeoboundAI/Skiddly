import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

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
          };
        } catch (error) {
          console.error("Auth error:", error.message);
          throw new Error(error.message);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.emailVerified = user.emailVerified;
        token.provider = user.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.emailVerified = token.emailVerified;
        session.user.provider = token.provider;
      }
      return session;
    },
    async signIn({ account, profile }) {
      if (account.provider === "google") {
        try {
          await connectDB();

          const userExists = await User.findOne({ email: profile.email });

          if (!userExists) {
            // Create new user from Google
            await User.create({
              email: profile.email,
              name: profile.name,
              image: profile.picture,
              emailVerified: true,
              provider: "google",
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
