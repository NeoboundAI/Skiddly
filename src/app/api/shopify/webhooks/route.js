import { NextResponse } from "next/server";
import { verifyShopifyWebhook } from "@/lib/shopify";
import connectDB from "@/lib/mongodb";
import AbandonedCart from "@/models/AbandonedCart";

export async function POST(request) {
  try {
    // Get the raw body for webhook verification
    const body = await request.text();

    // Get Shopify webhook headers
    const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
    const topicHeader = request.headers.get("x-shopify-topic");
    const shopHeader = request.headers.get("x-shopify-shop-domain");

    console.log("Webhook received:", {
      topic: topicHeader,
      shop: shopHeader,
      hasHmac: !!hmacHeader,
    });

    // Verify webhook authenticity
    if (!hmacHeader || !process.env.SHOPIFY_API_SECRET) {
      console.error("Missing HMAC header or API secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isValid = verifyShopifyWebhook(body, hmacHeader);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the webhook payload
    const webhookData = JSON.parse(body);

    // Log webhook data for debugging
    console.log("Webhook payload:", JSON.stringify(webhookData, null, 2));

    await connectDB();

    // Handle different webhook topics
    switch (topicHeader) {
      case "checkouts/create":
      case "checkouts/update":
        await handleCheckoutWebhook(webhookData, shopHeader);
        break;

      case "orders/create":
        await handleOrderWebhook(webhookData, shopHeader);
        break;

      default:
        console.log(`Unhandled webhook topic: ${topicHeader}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleCheckoutWebhook(webhookData, shopDomain) {
  try {
    const checkout = webhookData;

    // Only process abandoned checkouts
    if (checkout.abandoned_checkout_url) {
      console.log("Processing abandoned checkout:", checkout.id);

      // Check if this checkout already exists in our database
      const existingCart = await AbandonedCart.findOne({
        shopifyCheckoutId: checkout.id.toString(),
      });

      if (existingCart) {
        // Update existing cart
        await AbandonedCart.findOneAndUpdate(
          { shopifyCheckoutId: checkout.id.toString() },
          {
            shopDomain,
            customerEmail: checkout.email,
            customerPhone: checkout.phone,
            customerFirstName: checkout.customer?.first_name,
            customerLastName: checkout.customer?.last_name,
            totalPrice: checkout.total_price,
            currency: checkout.currency,
            lineItems: checkout.line_items || [],
            abandonedAt: new Date(checkout.updated_at),
            lastUpdated: new Date(),
            isActive: true,
          }
        );
        console.log("Updated existing abandoned cart:", checkout.id);
      } else {
        // Create new abandoned cart
        await AbandonedCart.create({
          shopifyCheckoutId: checkout.id.toString(),
          shopDomain,
          customerEmail: checkout.email,
          customerPhone: checkout.phone,
          customerFirstName: checkout.customer?.first_name,
          customerLastName: checkout.customer?.last_name,
          totalPrice: checkout.total_price,
          currency: checkout.currency,
          lineItems: checkout.line_items || [],
          abandonedAt: new Date(checkout.updated_at),
          lastUpdated: new Date(),
          isActive: true,
        });
        console.log("Created new abandoned cart:", checkout.id);
      }
    }
  } catch (error) {
    console.error("Error handling checkout webhook:", error);
    throw error;
  }
}

async function handleOrderWebhook(webhookData, shopDomain) {
  try {
    const order = webhookData;

    // If an order is created, it means the checkout was completed
    // We should mark any related abandoned cart as completed
    if (order.checkout_id) {
      await AbandonedCart.findOneAndUpdate(
        { shopifyCheckoutId: order.checkout_id.toString() },
        {
          isActive: false,
          completedAt: new Date(),
          lastUpdated: new Date(),
        }
      );
      console.log("Marked abandoned cart as completed:", order.checkout_id);
    }
  } catch (error) {
    console.error("Error handling order webhook:", error);
    throw error;
  }
}
