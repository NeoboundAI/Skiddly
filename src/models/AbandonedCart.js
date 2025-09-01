import mongoose from "mongoose";

const AbandonedCartSchema = new mongoose.Schema(
  {
    // Shopify checkout ID (unique identifier)
    shopifyCheckoutId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Shop domain
    shopDomain: {
      type: String,
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

    // Cart details
    totalPrice: {
      type: String,
      required: true,
    },

    currency: {
      type: String,
      default: "USD",
    },

    // Line items (products in cart)
    lineItems: [
      {
        id: String,
        title: String,
        quantity: Number,
        price: String,
        variant_id: String,
        product_id: String,
      },
    ],

    // Timestamps
    abandonedAt: {
      type: Date,
      required: true,
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Additional metadata
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

// Index for efficient queries
AbandonedCartSchema.index({ shopDomain: 1, isActive: 1, abandonedAt: -1 });
AbandonedCartSchema.index({ customerEmail: 1, isActive: 1 });

// Virtual for customer full name
AbandonedCartSchema.virtual("customerFullName").get(function () {
  if (this.customerFirstName && this.customerLastName) {
    return `${this.customerFirstName} ${this.customerLastName}`;
  } else if (this.customerFirstName) {
    return this.customerFirstName;
  } else if (this.customerLastName) {
    return this.customerLastName;
  }
  return "Guest Customer";
});

// Method to check if cart is still active (not completed)
AbandonedCartSchema.methods.isStillActive = function () {
  return this.isActive && !this.completedAt;
};

// Static method to get active abandoned carts for a shop
AbandonedCartSchema.statics.getActiveCarts = function (shopDomain, limit = 50) {
  return this.find({
    shopDomain,
    isActive: true,
  })
    .sort({ abandonedAt: -1 })
    .limit(limit);
};

// Static method to mark cart as completed
AbandonedCartSchema.statics.markAsCompleted = function (checkoutId) {
  return this.findOneAndUpdate(
    { shopifyCheckoutId: checkoutId },
    {
      isActive: false,
      completedAt: new Date(),
      lastUpdated: new Date(),
    },
    { new: true }
  );
};

const AbandonedCart =
  mongoose.models.AbandonedCart ||
  mongoose.model("AbandonedCart", AbandonedCartSchema);

export default AbandonedCart;
