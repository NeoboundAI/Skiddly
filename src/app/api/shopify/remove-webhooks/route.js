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

    // First, get all existing webhooks
    const getWebhooksResponse = await fetch(
      `https://${shop}/admin/api/${
        process.env.SHOPIFY_VERSION || "2025-07"
      }/webhooks.json`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
      }
    );

    if (!getWebhooksResponse.ok) {
      const errorText = await getWebhooksResponse.text();
      console.error("Failed to fetch webhooks:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch existing webhooks" },
        { status: 500 }
      );
    }

    const webhooksData = await getWebhooksResponse.json();
    const webhooks = webhooksData.webhooks || [];

    console.log(`Found ${webhooks.length} existing webhooks`);

    const removedWebhooks = [];
    let removedCount = 0;

    // Remove each webhook
    for (const webhook of webhooks) {
      try {
        const deleteResponse = await fetch(
          `https://${shop}/admin/api/${
            process.env.SHOPIFY_VERSION || "2025-07"
          }/webhooks/${webhook.id}.json`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": accessToken,
            },
          }
        );

        if (deleteResponse.ok) {
          console.log(
            `Successfully removed webhook: ${webhook.topic} (ID: ${webhook.id})`
          );
          removedWebhooks.push({
            id: webhook.id,
            topic: webhook.topic,
            status: "removed",
          });
          removedCount++;
        } else {
          const errorText = await deleteResponse.text();
          console.error(`Failed to remove webhook ${webhook.id}:`, errorText);
          removedWebhooks.push({
            id: webhook.id,
            topic: webhook.topic,
            status: "failed",
            error: errorText,
          });
        }
      } catch (error) {
        console.error(`Error removing webhook ${webhook.id}:`, error);
        removedWebhooks.push({
          id: webhook.id,
          topic: webhook.topic,
          status: "failed",
          error: error.message,
        });
      }
    }

    // Update shop connection to reflect webhooks are removed
    await ShopifyShop.findByIdAndUpdate(shopConnection._id, {
      webhooksRegistered: false,
      registeredWebhooks: [],
      webhookRegistrationDate: null,
    });

    console.log(
      `Webhook removal completed. ${removedCount}/${webhooks.length} webhooks removed.`
    );

    return NextResponse.json({
      success: true,
      message: `Webhook removal completed. ${removedCount}/${webhooks.length} webhooks removed.`,
      removedWebhooks,
      totalFound: webhooks.length,
      totalRemoved: removedCount,
    });
  } catch (error) {
    console.error("Webhook removal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
