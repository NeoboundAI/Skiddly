import mongoose from "mongoose";

const CartSchema = new mongoose.Schema(
  {
    // Shopify checkout data
    shopifyCheckoutId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    token: {
      type: String,
      required: true,
    },

    cartToken: {
      type: String,
      required: true,
    },

    // Shop information
    shopDomain: {
      type: String,
      required: true,
      index: true,
    },

    // User reference (from ShopifyShop collection)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Customer information
    customerEmail: {
      type: String,
      index: true,
    },

    customerPhone: {
      type: String,
      default: null,
    },

    customerFirstName: {
      type: String,
      default: null,
    },

    customerLastName: {
      type: String,
      default: null,
    },

    customerId: {
      type: String, // Shopify customer ID
      default: null,
    },

    // Cart details
    totalPrice: {
      type: String,
      required: true,
    },

    subtotalPrice: {
      type: String,
      default: "0.00",
    },

    totalTax: {
      type: String,
      default: "0.00",
    },

    totalDiscounts: {
      type: String,
      default: "0.00",
    },

    currency: {
      type: String,
      default: "USD",
    },

    presentmentCurrency: {
      type: String,
      default: "USD",
    },

    // Line items (products in cart)
    lineItems: [
      {
        key: String,
        title: String,
        presentmentTitle: String,
        variantTitle: String,
        presentmentVariantTitle: String,
        quantity: Number,
        price: String,
        linePrice: String,
        variantPrice: String,
        variantId: String,
        productId: String,
        sku: String,
        vendor: String,
        grams: Number,
        taxable: Boolean,
        requiresShipping: Boolean,
        giftCard: Boolean,
      },
    ],

    // Shopify checkout URLs and references
    abandonedCheckoutUrl: {
      type: String,
      required: true,
    },

    // Checkout status and timing
    status: {
      type: String,
      enum: ["inCheckout", "abandoned", "purchased", "expired"],
      default: "inCheckout",
      index: true,
    },

    // Important timestamps
    shopifyCreatedAt: {
      type: Date,
      required: true,
    },

    shopifyUpdatedAt: {
      type: Date,
      required: true,
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // Address information
    shippingAddress: {
      firstName: String,
      lastName: String,
      company: String,
      address1: String,
      address2: String,
      city: String,
      province: String,
      country: String,
      zip: String,
      phone: String,
      provinceCode: String,
      countryCode: String,
    },

    // Additional Shopify data
    buyerAcceptsMarketing: {
      type: Boolean,
      default: false,
    },

    buyerAcceptsSmsMarketing: {
      type: Boolean,
      default: false,
    },

    smsMarketingPhone: {
      type: String,
      default: null,
    },

    customerLocale: {
      type: String,
      default: "en",
    },

    sourceName: {
      type: String,
      default: "web",
    },

    landingSite: String,
    referringSite: String,
    note: String,
    noteAttributes: [{}],

    discountCodes: [{}],
    taxLines: [{}],
    shippingLines: [{}],

    // Gateway and device info
    gateway: String,
    deviceId: String,
    locationId: String,

    // Correlation ID for tracing
    correlationId: {
      type: String,
    },

    // Metadata for additional info
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
CartSchema.index({ shopDomain: 1, status: 1, lastActivityAt: -1 });
CartSchema.index({ userId: 1, status: 1, shopifyUpdatedAt: -1 });
CartSchema.index({ customerEmail: 1, status: 1 });
CartSchema.index({ correlationId: 1 });

// Note: Cart status changes are handled by the CartScannerQueue system
// No static methods needed - the queue automatically processes abandonment

const Cart = mongoose.models.Cart || mongoose.model("Cart", CartSchema);

export default Cart;
