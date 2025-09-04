import { NextResponse } from "next/server";
import { verifyShopifyWebhook } from "@/lib/shopify";
import connectDB from "@/lib/mongodb";
import Cart from "@/models/Cart";
import AbandonedCart from "@/models/AbandonedCart";
import ShopifyShop from "@/models/ShopifyShop";
import { scheduleAbandonedCartCheck, cancelCartJobs } from "@/lib/agenda";
import {
  logApiError,
  logApiSuccess,
  logBusinessEvent,
  logDbOperation,
  logExternalApi,
} from "@/lib/apiLogger";
import {
  generateWebhookCorrelationId,
  generateCorrelationId,
} from "@/utils/correlationUtils";

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

    // Generate correlation ID for this webhook
    const correlationId = generateWebhookCorrelationId(
      topicHeader,
      webhookData.id
    );

    // Handle different webhook topics
    switch (topicHeader) {
      case "checkouts/create":
        await handleCheckoutCreateWebhook(
          webhookData,
          shopHeader,
          correlationId
        );
        break;
      case "checkouts/update":
        await handleCheckoutUpdateWebhook(
          webhookData,
          shopHeader,
          correlationId
        );
        break;

      case "orders/create":
        await handleOrderCreateWebhook(webhookData, shopHeader, correlationId);
        break;

      default:
        logBusinessEvent("shopify_webhook_unhandled", correlationId, {
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

// Handle checkout create webhook - add to inCheckout collection
async function handleCheckoutCreateWebhook(
  webhookData,
  shopDomain,
  correlationId
) {
  try {
    const checkout = webhookData;

    logBusinessEvent("shopify_checkout_create", correlationId, {
      checkoutId: checkout.id,
      shop: shopDomain,
      customerEmail: checkout.email,
      totalPrice: checkout.total_price,
    });

    // Find the shop and user
    const shop = await ShopifyShop.findOne({ shop: shopDomain });
    if (!shop) {
      throw new Error(`Shop not found: ${shopDomain}`);
    }

    // Check if cart already exists
    const existingCart = await Cart.findOne({
      shopifyCheckoutId: checkout.id.toString(),
    });

    let cart;
    if (existingCart) {
      // Update existing cart
      cart = await Cart.findOneAndUpdate(
        { shopifyCheckoutId: checkout.id.toString() },
        {
          ...buildCartData(checkout, shop, correlationId),
          lastActivityAt: new Date(),
        },
        { new: true }
      );

      logDbOperation("update", "Cart", correlationId, {
        cartId: cart._id,
        action: "update_existing_checkout",
      });
    } else {
      // Create new cart in inCheckout status
      cart = await Cart.create({
        ...buildCartData(checkout, shop, correlationId),
        status: "inCheckout",
      });

      logDbOperation("create", "Cart", correlationId, {
        cartId: cart._id,
        action: "create_new_checkout",
      });

      // Schedule abandoned cart check for 20 minutes later
      await scheduleAbandonedCartCheck({
        cartId: cart._id,
        shopifyCheckoutId: checkout.id.toString(),
        userId: shop.userId,
        correlationId,
      });

      logBusinessEvent("abandoned_cart_check_scheduled", correlationId, {
        cartId: cart._id,
        checkTime: "20 minutes",
      });
    }
  } catch (error) {
    logApiError(
      "POST",
      "/api/shopify/webhooks/checkout/create",
      500,
      error,
      correlationId,
      {
        checkoutId: webhookData.id,
        shop: shopDomain,
      }
    );
    throw error;
  }
}
// Handle checkout update webhook - update cart activity
async function handleCheckoutUpdateWebhook(
  webhookData,
  shopDomain,
  correlationId
) {
  try {
    const checkout = webhookData;

    logBusinessEvent("shopify_checkout_update", correlationId, {
      checkoutId: checkout.id,
      shop: shopDomain,
      customerEmail: checkout.email,
      totalPrice: checkout.total_price,
    });

    // Find the shop and user
    const shop = await ShopifyShop.findOne({ shop: shopDomain });
    if (!shop) {
      throw new Error(`Shop not found: ${shopDomain}`);
    }

    // Find existing cart
    const existingCart = await Cart.findOne({
      shopifyCheckoutId: checkout.id.toString(),
    });

    if (existingCart) {
      // Update cart data and reset activity timer
      const updatedCart = await Cart.findOneAndUpdate(
        { shopifyCheckoutId: checkout.id.toString() },
        {
          ...buildCartData(checkout, shop, correlationId),
          lastActivityAt: new Date(), // Reset the 20-minute timer
          status: "inCheckout", // Ensure it's back to inCheckout if it was marked as abandoned
        },
        { new: true }
      );

      logDbOperation("update", "Cart", correlationId, {
        cartId: updatedCart._id,
        action: "update_activity_reset_timer",
      });

      // Cancel any existing scheduled abandoned cart jobs for this cart
      await cancelCartJobs(updatedCart._id);

      // Schedule new abandoned cart check for 20 minutes from now
      await scheduleAbandonedCartCheck({
        cartId: updatedCart._id,
        shopifyCheckoutId: checkout.id.toString(),
        userId: shop.userId,
        correlationId,
      });

      logBusinessEvent("activity_timer_reset", correlationId, {
        cartId: updatedCart._id,
        newCheckTime: "20 minutes",
      });
    } else {
      // Create new cart if it doesn't exist (shouldn't happen normally)
      const newCart = await Cart.create({
        ...buildCartData(checkout, shop, correlationId),
        status: "inCheckout",
      });

      logDbOperation("create", "Cart", correlationId, {
        cartId: newCart._id,
        action: "create_from_update",
      });

      await scheduleAbandonedCartCheck({
        cartId: newCart._id,
        shopifyCheckoutId: checkout.id.toString(),
        userId: shop.userId,
        correlationId,
      });
    }
  } catch (error) {
    logApiError(
      "POST",
      "/api/shopify/webhooks/checkout/update",
      500,
      error,
      correlationId,
      {
        checkoutId: webhookData.id,
        shop: shopDomain,
      }
    );
    throw error;
  }
}

// Handle order create webhook - mark cart as purchased
async function handleOrderCreateWebhook(
  webhookData,
  shopDomain,
  correlationId
) {
  try {
    const order = webhookData;

    logBusinessEvent("shopify_order_create", correlationId, {
      orderId: order.id,
      checkoutId: order.checkout_id,
      shop: shopDomain,
      totalPrice: order.total_price,
    });

    // If an order is created, it means the checkout was completed
    if (order.checkout_id) {
      // Mark the original cart as purchased
      const purchasedCart = await Cart.markAsPurchased(
        order.checkout_id.toString()
      );

      if (purchasedCart) {
        logDbOperation("update", "Cart", correlationId, {
          cartId: purchasedCart._id,
          action: "mark_as_purchased",
        });

        // Cancel any pending abandoned cart jobs
        await cancelCartJobs(purchasedCart._id);

        // If there's an active abandoned cart record, mark it as recovered
        const abandonedCart = await AbandonedCart.findOne({
          shopifyCheckoutId: order.checkout_id.toString(),
          isActive: true,
        });

        if (abandonedCart) {
          await abandonedCart.markAsRecovered(correlationId, {
            orderId: order.id,
            orderValue: order.total_price,
            recoveredBeforeCall: abandonedCart.totalCallAttempts === 0,
          });

          logBusinessEvent("abandoned_cart_recovered", correlationId, {
            abandonedCartId: abandonedCart._id,
            orderId: order.id,
            recoveredBeforeCall: abandonedCart.totalCallAttempts === 0,
          });
        }

        logBusinessEvent("cart_purchase_completed", correlationId, {
          cartId: purchasedCart._id,
          orderId: order.id,
          checkoutId: order.checkout_id,
        });
      }
    }
  } catch (error) {
    logApiError(
      "POST",
      "/api/shopify/webhooks/order/create",
      500,
      error,
      correlationId,
      {
        orderId: webhookData.id,
        checkoutId: webhookData.checkout_id,
        shop: shopDomain,
      }
    );
    throw error;
  }
}

// Helper function to build cart data from Shopify checkout
function buildCartData(checkout, shop, correlationId) {
  return {
    shopifyCheckoutId: checkout.id.toString(),
    token: checkout.token,
    cartToken: checkout.cart_token,
    shopDomain: shop.shop,
    userId: shop.userId,

    // Customer information
    customerEmail: checkout.email,
    customerPhone: checkout.phone,
    customerFirstName: checkout.customer?.first_name,
    customerLastName: checkout.customer?.last_name,
    customerId: checkout.customer?.id?.toString(),

    // Cart details
    totalPrice: checkout.total_price,
    subtotalPrice: checkout.subtotal_price,
    totalTax: checkout.total_tax,
    totalDiscounts: checkout.total_discounts,
    currency: checkout.currency,
    presentmentCurrency: checkout.presentment_currency,

    // Line items
    lineItems:
      checkout.line_items?.map((item) => ({
        key: item.key,
        title: item.title,
        presentmentTitle: item.presentment_title,
        variantTitle: item.variant_title,
        presentmentVariantTitle: item.presentment_variant_title,
        quantity: item.quantity,
        price: item.price,
        linePrice: item.line_price,
        variantPrice: item.variant_price,
        variantId: item.variant_id?.toString(),
        productId: item.product_id?.toString(),
        sku: item.sku,
        vendor: item.vendor,
        grams: item.grams,
        taxable: item.taxable,
        requiresShipping: item.requires_shipping,
        giftCard: item.gift_card,
      })) || [],

    // Checkout URLs and references
    abandonedCheckoutUrl: checkout.abandoned_checkout_url,

    // Timestamps
    shopifyCreatedAt: new Date(checkout.created_at),
    shopifyUpdatedAt: new Date(checkout.updated_at),

    // Address information
    shippingAddress: checkout.shipping_address
      ? {
          firstName: checkout.shipping_address.first_name,
          lastName: checkout.shipping_address.last_name,
          company: checkout.shipping_address.company,
          address1: checkout.shipping_address.address1,
          address2: checkout.shipping_address.address2,
          city: checkout.shipping_address.city,
          province: checkout.shipping_address.province,
          country: checkout.shipping_address.country,
          zip: checkout.shipping_address.zip,
          phone: checkout.shipping_address.phone,
          provinceCode: checkout.shipping_address.province_code,
          countryCode: checkout.shipping_address.country_code,
        }
      : undefined,

    // Additional Shopify data
    buyerAcceptsMarketing: checkout.buyer_accepts_marketing,
    buyerAcceptsSmsMarketing: checkout.buyer_accepts_sms_marketing,
    smsMarketingPhone: checkout.sms_marketing_phone,
    customerLocale: checkout.customer_locale,
    sourceName: checkout.source_name,
    landingSite: checkout.landing_site,
    referringSite: checkout.referring_site,
    note: checkout.note,
    noteAttributes: checkout.note_attributes,
    discountCodes: checkout.discount_codes,
    taxLines: checkout.tax_lines,
    shippingLines: checkout.shipping_lines,
    gateway: checkout.gateway,
    deviceId: checkout.device_id,
    locationId: checkout.location_id,

    // Correlation ID for tracing
    correlationId,
  };
}
