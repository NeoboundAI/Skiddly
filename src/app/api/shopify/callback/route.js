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

    // Register webhooks automatically after successful connection
    try {
      // Ensure we use HTTPS for webhook URLs (Shopify requirement)
      let webhookUrl = `${process.env.NEXTAUTH_URL}/api/shopify/webhooks`;

      // For development, if NEXTAUTH_URL is HTTP, we need to use a public HTTPS URL
      if (
        process.env.NODE_ENV === "development" &&
        webhookUrl.startsWith("http://")
      ) {
        // Use ngrok or similar for development webhooks
        if (process.env.WEBHOOK_URL) {
          webhookUrl = `${process.env.WEBHOOK_URL}/api/shopify/webhooks`;
        } else {
          console.log(
            "⚠️  Webhook registration skipped in development - HTTPS URL required"
          );
          console.log(
            "💡 Set WEBHOOK_URL environment variable to your ngrok URL for development webhooks"
          );

          // Update user to show webhook registration was skipped
          await User.findByIdAndUpdate(user._id, {
            "shopify.webhooksRegistered": false,
            "shopify.registeredWebhooks": [
              {
                topic: "development_skipped",
                error:
                  "HTTPS required for webhooks. Set WEBHOOK_URL for development.",
                status: "skipped",
              },
            ],
          });

          // Don't proceed with webhook registration in development without HTTPS
          return NextResponse.redirect(
            `${process.env.NEXTAUTH_URL}/dashboard?success=shopify_connected&webhook_skipped=true`
          );
        }
      }
      const webhookTopics = [
        "CHECKOUTS_CREATE",
        "CHECKOUTS_UPDATE",
        "ORDERS_CREATE",
      ];

      const registeredWebhooks = [];
      let webhookSuccessCount = 0;

      // Register webhooks using REST Admin API (more reliable)
      for (const topic of webhookTopics) {
        try {
          const webhookResponse = await fetch(
            `https://${shop}/admin/api/${
              process.env.SHOPIFY_VERSION || "2025-07"
            }/webhooks.json`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": tokenResponse.access_token,
              },
              body: JSON.stringify({
                webhook: {
                  topic: topic.toLowerCase().replace("_", "/"),
                  address: webhookUrl,
                  format: "json",
                },
              }),
            }
          );

          if (webhookResponse.ok) {
            const webhookData = await webhookResponse.json();
            console.log(
              `Webhook response for ${topic}:`,
              JSON.stringify(webhookData, null, 2)
            );

            console.log(`Successfully registered webhook for ${topic}`);
            registeredWebhooks.push({
              topic,
              status: "registered",
              webhookId: webhookData.webhook?.id,
              callbackUrl: webhookData.webhook?.address,
            });
            webhookSuccessCount++;
          } else {
            const errorText = await webhookResponse.text();
            console.error(
              `Failed to register webhook for ${topic}:`,
              `Status: ${webhookResponse.status}`,
              `StatusText: ${webhookResponse.statusText}`,
              `Response: ${errorText}`
            );

            // Check if webhook already exists
            if (errorText.includes("already been taken")) {
              console.log(
                `Webhook for ${topic} already exists - marking as registered`
              );
              registeredWebhooks.push({
                topic,
                status: "already_registered",
                webhookId: "existing",
                callbackUrl: webhookUrl,
              });
              webhookSuccessCount++;
            } else {
              registeredWebhooks.push({
                topic,
                error: errorText,
                status: "failed",
                statusCode: webhookResponse.status,
              });
            }
          }
        } catch (webhookError) {
          console.error(
            `Error registering webhook for ${topic}:`,
            webhookError
          );
          registeredWebhooks.push({
            topic,
            error: webhookError.message,
            status: "failed",
          });
        }
      }

      // Update user with webhook registration status
      await User.findByIdAndUpdate(user._id, {
        "shopify.webhooksRegistered": webhookSuccessCount > 0,
        "shopify.webhookRegistrationDate": new Date(),
        "shopify.registeredWebhooks": registeredWebhooks,
      });

      console.log(
        `Webhook registration completed. ${webhookSuccessCount}/${webhookTopics.length} webhooks active.`
      );
    } catch (webhookError) {
      console.error("Error registering webhooks:", webhookError);
      // Don't fail the connection if webhook registration fails
      // But still update user to show webhook registration failed
      await User.findByIdAndUpdate(user._id, {
        "shopify.webhooksRegistered": false,
        "shopify.registeredWebhooks": [
          {
            topic: "all",
            error: webhookError.message,
            status: "failed",
          },
        ],
      });
    }

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
