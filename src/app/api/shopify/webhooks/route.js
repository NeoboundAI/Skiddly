import { NextResponse } from "next/server";
import { verifyShopifyWebhook } from "@/lib/shopify";
import connectDB from "@/lib/mongodb";
import Cart from "@/models/Cart";
import ShopifyShop from "@/models/ShopifyShop";
import { generateWebhookCorrelationId } from "@/utils/correlationUtils";

export async function POST(request) {
  try {
    // Get the raw body for webhook verification
    const body = await request.text();

    // Get Shopify webhook headers
    const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
    const topicHeader = request.headers.get("x-shopify-topic");
    const shopHeader = request.headers.get("x-shopify-shop-domain");

    console.log("Shopify webhook received:", {
      topic: topicHeader,
      shop: shopHeader,
      hasHmac: !!hmacHeader,
      bodyLength: body?.length || 0,
      bodyPreview: body?.substring(0, 100) || "empty",
    });

    // Verify webhook authenticity
    if (!hmacHeader || !process.env.SHOPIFY_API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isValid = verifyShopifyWebhook(body, hmacHeader);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the webhook payload
    let webhookData;
    try {
      if (!body || body.trim() === "") {
        console.error("Empty webhook body received");
        return NextResponse.json(
          { error: "Empty webhook body" },
          { status: 400 }
        );
      }

      webhookData = JSON.parse(body);
      console.log("Webhook data received for:", webhookData?.id || "unknown");
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      console.error("Raw body:", body);
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Validate webhook data
    if (!webhookData || !webhookData.id) {
      console.error("Invalid webhook data - missing ID:", webhookData);
      return NextResponse.json(
        { error: "Invalid webhook data" },
        { status: 400 }
      );
    }

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
        console.log(`Unhandled webhook topic: ${topicHeader}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle checkout create webhook - add to Cart collection
async function handleCheckoutCreateWebhook(
  webhookData,
  shopDomain,
  correlationId
) {
  try {
    const checkout = webhookData;

    console.log("Handling checkout create:", {
      checkoutId: checkout.id,
      shop: shopDomain,
      customerEmail: checkout.email,
      totalPrice: checkout.total_price,
    });

    // Extract shop domain from abandoned checkout URL as fallback
    const urlShopDomain = extractShopDomainFromUrl(
      checkout.abandoned_checkout_url
    );
    const finalShopDomain = urlShopDomain || shopDomain;

    // Find the shop and user
    const shop = await ShopifyShop.findOne({ shop: finalShopDomain });
    if (!shop) {
      throw new Error(`Shop not found: ${finalShopDomain}`);
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
          ...buildCartData(checkout, shop, correlationId, finalShopDomain),
          lastActivityAt: new Date(),
        },
        { new: true }
      );
      console.log(`Updated existing cart: ${cart._id}`);
    } else {
      // Create new cart in inCheckout status
      cart = await Cart.create({
        ...buildCartData(checkout, shop, correlationId, finalShopDomain),
        status: "inCheckout",
      });
      console.log(`Created new cart: ${cart._id}`);
    }
  } catch (error) {
    console.error("Checkout create error:", error);
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

    console.log("Handling checkout update:", {
      checkoutId: checkout.id,
      shop: shopDomain,
      customerEmail: checkout.email,
      totalPrice: checkout.total_price,
    });

    // Extract shop domain from abandoned checkout URL as fallback
    const urlShopDomain = extractShopDomainFromUrl(
      checkout.abandoned_checkout_url
    );
    const finalShopDomain = urlShopDomain || shopDomain;

    // Find the shop and user
    const shop = await ShopifyShop.findOne({ shop: finalShopDomain });
    if (!shop) {
      throw new Error(`Shop not found: ${finalShopDomain}`);
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
          ...buildCartData(checkout, shop, correlationId, finalShopDomain),
          lastActivityAt: new Date(), // Reset the timer
          status: "inCheckout", // Ensure it's back to inCheckout if it was marked as abandoned
        },
        { new: true }
      );
      console.log(`Updated cart activity: ${updatedCart._id}`);
    } else {
      // Create new cart if it doesn't exist (shouldn't happen normally)
      const newCart = await Cart.create({
        ...buildCartData(checkout, shop, correlationId, finalShopDomain),
        status: "inCheckout",
      });
      console.log(`Created new cart from update: ${newCart._id}`);
    }
  } catch (error) {
    console.error("Checkout update error:", error);
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

    console.log("Handling order create:", {
      orderId: order.id,
      checkoutId: order.checkout_id,
      shop: shopDomain,
      totalPrice: order.total_price,
    });

    // If an order is created, it means the checkout was completed
    if (order.checkout_id) {
      // Mark the original cart as purchased
      const purchasedCart = await Cart.findOneAndUpdate(
        { shopifyCheckoutId: order.checkout_id.toString() },
        { status: "purchased", completedAt: new Date() },
        { new: true }
      );

      if (purchasedCart) {
        console.log(`Marked cart as purchased: ${purchasedCart._id}`);
      }
    }
  } catch (error) {
    console.error("Order create error:", error);
    throw error;
  }
}

// Helper function to extract shop domain from abandoned checkout URL
function extractShopDomainFromUrl(abandonedCheckoutUrl) {
  if (!abandonedCheckoutUrl) return null;

  try {
    const url = new URL(abandonedCheckoutUrl);
    const hostname = url.hostname;

    // Extract shop name from hostname (e.g., "culaterline.myshopify.com" -> "culaterline.myshopify.com")
    if (hostname.endsWith(".myshopify.com")) {
      return hostname;
    }

    return null;
  } catch (error) {
    console.error("Error extracting shop domain from URL:", error);
    return null;
  }
}

// Helper function to build cart data from Shopify checkout
function buildCartData(checkout, shop, correlationId, shopDomain = null) {
  // Use provided shop domain or extract from abandoned checkout URL as fallback
  const urlShopDomain = extractShopDomainFromUrl(
    checkout.abandoned_checkout_url
  );
  const finalShopDomain = shopDomain || urlShopDomain || shop.shop;

  return {
    userId: shop.userId,
    shopId: shop._id,

    shopifyCheckoutId: checkout.id.toString(),
    token: checkout.token,
    cartToken: checkout.cart_token,
    shopDomain: finalShopDomain,

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
