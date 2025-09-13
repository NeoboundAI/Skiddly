import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AUTH_URL: process.env.AUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    GOOGLE_ID: process.env.GOOGLE_ID ? "SET" : "NOT SET",
    GOOGLE_SECRET: process.env.GOOGLE_SECRET ? "SET" : "NOT SET",
    AUTH_SECRET: process.env.AUTH_SECRET ? "SET" : "NOT SET",
    // Show what the redirect URI would be
    CALCULATED_REDIRECT_URI: process.env.NEXTAUTH_URL
      ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/auth/callback/google`
      : "UNDEFINED",
  });
}
