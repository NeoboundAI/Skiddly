import { NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/shopify";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const shop = searchParams.get("shop");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    console.log("code", code);
    console.log("shop", shop);
    console.log("state", state);
    console.log("error", error);

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?error=shopify_auth_denied`
      );
    }

    if (!code || !shop || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?error=invalid_callback_params`
      );
    }

    await connectDB();

    // Find user by state (stored during OAuth initiation)
    const user = await User.findOne({ "shopify.state": state });
    if (!user) {
      console.error("No user found with state:", state);
      // Check if user has any Shopify connection
      const usersWithShopify = await User.find({ "shopify.isActive": true });
      if (usersWithShopify.length > 0) {
        // If there's already a connected user, redirect with a different error
        return NextResponse.redirect(
          `${process.env.NEXTAUTH_URL}/dashboard?error=connection_exists`
        );
      }
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?error=invalid_state`
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await exchangeCodeForToken(shop, code);

    // Update user with Shopify connection details
    await User.findByIdAndUpdate(user._id, {
      "shopify.accessToken": tokenResponse.access_token,
      "shopify.scope": tokenResponse.scope,
      "shopify.isActive": true,
      "shopify.connectedAt": new Date(),
      "shopify.state": null, // Clear the state
    });

    console.log("Successfully connected Shopify for user:", user._id);

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?success=shopify_connected`
    );
  } catch (error) {
    console.error("Shopify callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?error=token_exchange_failed`
    );
  }
}
