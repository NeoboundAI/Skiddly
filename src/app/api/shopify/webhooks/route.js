import { NextResponse } from "next/server";
import { verifyShopifyWebhook } from "@/lib/shopify";
import connectDB from "@/lib/mongodb";
import AbandonedCart from "@/models/AbandonedCart";
import {
  logApiError,
  logApiSuccess,
  logBusinessEvent,
  logDbOperation,
  logExternalApi,
} from "@/lib/apiLogger";

export async function POST(request) {
  try {
    // Get the raw body for webhook verification
    const body = await request.text();

    // Get Shopify webhook headers
    const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
    const topicHeader = request.headers.get("x-shopify-topic");
    const shopHeader = request.headers.get("x-shopify-shop-domain");

    logExternalApi("Shopify", "webhook_received", null, {
      topic: topicHeader,
      shop: shopHeader,
      hasHmac: !!hmacHeader,
    });

    // Verify webhook authenticity
    if (!hmacHeader || !process.env.SHOPIFY_API_SECRET) {
      logApiError(
        "POST",
        "/api/shopify/webhooks",
        401,
        new Error("Missing HMAC header or API secret"),
        null,
        {
          topic: topicHeader,
          shop: shopHeader,
        }
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isValid = verifyShopifyWebhook(body, hmacHeader);
    if (!isValid) {
      logApiError(
        "POST",
        "/api/shopify/webhooks",
        401,
        new Error("Invalid webhook signature"),
        null,
        {
          topic: topicHeader,
          shop: shopHeader,
        }
      );
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the webhook payload
    const webhookData = JSON.parse(body);

    await connectDB();

    // Handle different webhook topics
    switch (topicHeader) {
      case "checkouts/create":
        await handleCheckoutCreateWebhook(webhookData, shopHeader);
        break;
      case "checkouts/update":
        await handleCheckoutWebhook(webhookData, shopHeader);
        break;

      case "orders/create":
        await handleOrderWebhook(webhookData, shopHeader);
        break;

      default:
        logBusinessEvent("shopify_webhook_unhandled", null, {
          topic: topicHeader,
          shop: shopHeader,
        });
    }

    logApiSuccess("POST", "/api/shopify/webhooks", 200, null, {
      topic: topicHeader,
      shop: shopHeader,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError("POST", "/api/shopify/webhooks", 500, error, null, {
      topic: request.headers.get("x-shopify-topic"),
      shop: request.headers.get("x-shopify-shop-domain"),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCreateWebhook(webhookData, shopDomain) {
  try {
    const checkout = webhookData;

    // Only process abandoned checkouts
    if (checkout.abandoned_checkout_url) {
      logBusinessEvent("shopify_create_checkout", null, {
        checkoutId: checkout.id,
        shop: shopDomain,
        customerEmail: checkout.email ||"a@gmail.com",
      });
      console.log("checkout", checkout);

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
            customerEmail: checkout.email ||"a@gmail.com",
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

        logDbOperation("update", "Create Checkout", null, {
          checkoutId: checkout.id,
          shop: shopDomain,
          action: "update_existing",
        });
      } else {
        // Create new abandoned cart
        await AbandonedCart.create({
          shopifyCheckoutId: checkout.id.toString(),
          shopDomain,
          customerEmail: checkout.email||"a@gmail.com",
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

        logDbOperation("create", "Create Checkout", null, {
          checkoutId: checkout.id,
          shop: shopDomain,
          action: "create_new",
        });
      }
    }
  } catch (error) {
    logApiError("POST", "/api/shopify/webhooks/checkout", 500, error, null, {
      checkoutId: webhookData.id,
      shop: shopDomain,
    });
    throw error;
  }
}
async function handleCheckoutWebhook(webhookData, shopDomain) {
  try {
    const checkout = webhookData;

    // Only process abandoned checkouts
    if (checkout.abandoned_checkout_url) {
      logBusinessEvent("shopify_abandoned_checkout", null, {
        checkoutId: checkout.id,
        shop: shopDomain,
        customerEmail: checkout.email ||"a@gmail.com",
      });
      console.log("checkout", checkout);

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
            customerEmail: checkout.email ||"a@gmail.com",
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

        logDbOperation("update", "AbandonedCart", null, {
          checkoutId: checkout.id,
          shop: shopDomain,
          action: "update_existing",
        });
      } else {
        // Create new abandoned cart
        await AbandonedCart.create({
          shopifyCheckoutId: checkout.id.toString(),
          shopDomain,
          customerEmail: checkout.email||"a@gmail.com",
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

        logDbOperation("create", "AbandonedCart", null, {
          checkoutId: checkout.id,
          shop: shopDomain,
          action: "create_new",
        });
      }
    }
  } catch (error) {
    logApiError("POST", "/api/shopify/webhooks/checkout", 500, error, null, {
      checkoutId: webhookData.id,
      shop: shopDomain,
    });
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

      logDbOperation("update", "OrderCart", null, {
        checkoutId: order.checkout_id,
        shop: shopDomain,
        action: "mark_completed",
      });

      logBusinessEvent("shopify_order_completed", null, {
        orderId: order.id,
        checkoutId: order.checkout_id,
        shop: shopDomain,
      });
    }
  } catch (error) {
    logApiError("POST", "/api/shopify/webhooks/order", 500, error, null, {
      orderId: webhookData.id,
      shop: shopDomain,
    });
    throw error;
  }
}
