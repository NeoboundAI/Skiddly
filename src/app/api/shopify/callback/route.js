import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { exchangeCodeForToken } from "@/lib/shopify";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import ShopifyShop from "@/models/ShopifyShop";
import {
  logApiError,
  logApiSuccess,
  logBusinessEvent,
  logDbOperation,
  logExternalApi,
  logExternalApiError,
} from "@/lib/apiLogger";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const shop = searchParams.get("shop");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Get session for user identification
    const session = await getServerSession(authOptions);
    const userInfo = session?.user || null;

    logBusinessEvent("shopify_callback_received", userInfo, {
      shop,
      state,
      hasCode: !!code,
      hasError: !!error,
    });

    if (error) {
      // Clean up any incomplete connection for this state
      if (state) {
        await connectDB();
        await ShopifyShop.deleteMany({ oauthState: state });
        logDbOperation("delete", "ShopifyShop", userInfo, {
          reason: "cleanup_on_error",
          state,
        });
      }
      logBusinessEvent("shopify_callback_error", userInfo, {
        error,
        shop,
        state,
      });
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?error=shopify_auth_denied`
      );
    }

    if (!code || !shop || !state) {
      // Clean up any incomplete connection for this state
      if (state) {
        await connectDB();
        await ShopifyShop.deleteMany({ oauthState: state });
        logDbOperation("delete", "ShopifyShop", userInfo, {
          reason: "cleanup_invalid_params",
          state,
        });
      }
      logApiError(
        "GET",
        "/api/shopify/callback",
        400,
        new Error("Invalid callback parameters"),
        userInfo,
        {
          hasCode: !!code,
          hasShop: !!shop,
          hasState: !!state,
        }
      );
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?error=invalid_callback_params`
      );
    }

    await connectDB();

    // Find shop connection by state (stored during OAuth initiation)
    const shopConnection = await ShopifyShop.findOne({ oauthState: state });
    if (!shopConnection) {
      logApiError(
        "GET",
        "/api/shopify/callback",
        404,
        new Error("No shop connection found with state"),
        userInfo,
        {
          state,
        }
      );
      // Clean up any stale connections for this state
      await ShopifyShop.deleteMany({ oauthState: state });
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?error=invalid_state`
      );
    }

    // Get the user
    const user = await User.findById(shopConnection.userId);
    if (!user) {
      logApiError(
        "GET",
        "/api/shopify/callback",
        404,
        new Error("User not found for shop connection"),
        userInfo,
        {
          userId: shopConnection.userId,
          shop,
        }
      );
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?error=user_not_found`
      );
    }

    // Create user info object for logging
    const userInfoForLogging = { id: user._id.toString(), email: user.email };

    // Exchange authorization code for access token
    logExternalApi("Shopify", "exchange_code_for_token", userInfoForLogging, {
      shop,
    });

    const tokenResponse = await exchangeCodeForToken(shop, code);

    // Update shop connection with Shopify connection details
    await ShopifyShop.findByIdAndUpdate(shopConnection._id, {
      accessToken: tokenResponse.access_token,
      scope: tokenResponse.scope,
      isActive: true,
      connectedAt: new Date(),
      oauthState: null, // Clear the state
      oauthNonce: null, // Clear the nonce
    });

    logDbOperation("update", "ShopifyShop", userInfoForLogging, {
      shopId: shopConnection._id.toString(),
      shop,
      operation: "update_with_access_token",
    });

    logBusinessEvent("shopify_connection_success", userInfoForLogging, {
      shop,
      shopId: shopConnection._id.toString(),
    });

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
          logBusinessEvent("shopify_webhook_skipped", userInfoForLogging, {
            shop,
            reason: "development_no_https",
          });

          // Update shop connection to show webhook registration was skipped
          await ShopifyShop.findByIdAndUpdate(shopConnection._id, {
            webhooksRegistered: false,
            registeredWebhooks: [
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
          logExternalApi("Shopify", "register_webhook", userInfoForLogging, {
            shop,
            topic,
          });

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

            logBusinessEvent("shopify_webhook_registered", userInfoForLogging, {
              shop,
              topic,
              webhookId: webhookData.webhook?.id,
            });

            registeredWebhooks.push({
              topic,
              status: "registered",
              webhookId: webhookData.webhook?.id,
              callbackUrl: webhookData.webhook?.address,
            });
            webhookSuccessCount++;
          } else {
            const errorText = await webhookResponse.text();

            logExternalApiError(
              "Shopify",
              "register_webhook",
              new Error(`Failed to register webhook for ${topic}`),
              userInfoForLogging,
              {
                shop,
                topic,
                status: webhookResponse.status,
                error: errorText,
              }
            );

            // Check if webhook already exists
            if (errorText.includes("already been taken")) {
              logBusinessEvent(
                "shopify_webhook_already_exists",
                userInfoForLogging,
                {
                  shop,
                  topic,
                }
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
          logExternalApiError(
            "Shopify",
            "register_webhook",
            webhookError,
            userInfoForLogging,
            {
              shop,
              topic,
            }
          );
          registeredWebhooks.push({
            topic,
            error: webhookError.message,
            status: "failed",
          });
        }
      }

      // Update shop connection with webhook registration status
      await ShopifyShop.findByIdAndUpdate(shopConnection._id, {
        webhooksRegistered: webhookSuccessCount > 0,
        webhookRegistrationDate: new Date(),
        registeredWebhooks: registeredWebhooks,
      });

      logBusinessEvent(
        "shopify_webhook_registration_completed",
        userInfoForLogging,
        {
          shop,
          successCount: webhookSuccessCount,
          totalCount: webhookTopics.length,
        }
      );
    } catch (webhookError) {
      logExternalApiError(
        "Shopify",
        "register_webhooks",
        webhookError,
        userInfoForLogging,
        {
          shop,
        }
      );
      // Don't fail the connection if webhook registration fails
      // But still update shop connection to show webhook registration failed
      await ShopifyShop.findByIdAndUpdate(shopConnection._id, {
        webhooksRegistered: false,
        registeredWebhooks: [
          {
            topic: "all",
            error: webhookError.message,
            status: "failed",
          },
        ],
      });
    }

    logApiSuccess("GET", "/api/shopify/callback", 200, userInfoForLogging, {
      shop,
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?success=shopify_connected`
    );
  } catch (error) {
    // Get session for error logging
    const session = await getServerSession(authOptions);
    const userInfo = session?.user || null;

    logApiError("GET", "/api/shopify/callback", 500, error, userInfo, {
      shop: new URL(request.url).searchParams.get("shop"),
      state: new URL(request.url).searchParams.get("state"),
    });
    // Clean up incomplete connection on token exchange failure
    const state = new URL(request.url).searchParams.get("state");
    if (state) {
      await ShopifyShop.deleteMany({ oauthState: state });
    }
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?error=token_exchange_failed`
    );
  }
}
