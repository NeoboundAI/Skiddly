import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import ShopifyShop from "@/models/ShopifyShop";

export async function POST(request) {
  try {
    const { shop, accessToken } = await request.json();

    if (!shop || !accessToken) {
      return NextResponse.json(
        { error: "Shop and access token are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find shop connection
    const shopConnection = await ShopifyShop.findOne({
      shop: shop,
      isActive: true,
    });
    if (!shopConnection) {
      return NextResponse.json(
        { error: "No active Shopify connection found for this shop" },
        { status: 404 }
      );
    }

    // Ensure we use HTTPS for webhook URLs (Shopify requirement)
    let webhookUrl = `${process.env.NEXTAUTH_URL}/api/shopify/webhooks`;

    // For development, if NEXTAUTH_URL is HTTP, we need to use a public HTTPS URL
    if (
      process.env.NODE_ENV === "development" &&
      webhookUrl.startsWith("http://")
    ) {
      if (process.env.WEBHOOK_URL) {
        webhookUrl = `${process.env.WEBHOOK_URL}/api/shopify/webhooks`;
      } else {
        return NextResponse.json(
          {
            error:
              "HTTPS required for webhooks. Set WEBHOOK_URL environment variable for development.",
            webhookUrl: webhookUrl,
          },
          { status: 400 }
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
              "X-Shopify-Access-Token": accessToken,
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
        console.error(`Error registering webhook for ${topic}:`, webhookError);
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

    console.log(
      `Webhook registration completed. ${webhookSuccessCount}/${webhookTopics.length} webhooks active.`
    );

    return NextResponse.json({
      success: true,
      message: `Webhook registration completed. ${webhookSuccessCount}/${webhookTopics.length} webhooks active.`,
      registeredWebhooks,
      webhookUrl,
    });
  } catch (error) {
    console.error("Webhook registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
