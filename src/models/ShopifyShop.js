import mongoose from "mongoose";

const shopifyShopSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shop: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    scope: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
    webhooksRegistered: {
      type: Boolean,
      default: false,
    },
    webhookRegistrationDate: Date,
    registeredWebhooks: [
      {
        topic: String,
        id: String,
        status: String,
        error: String,
      },
    ],
    // Store temporary state for OAuth flow
    oauthState: String,
    oauthNonce: String,
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique shop per user
shopifyShopSchema.index({ userId: 1, shop: 1 }, { unique: true });

const ShopifyShop =
  mongoose.models.ShopifyShop ||
  mongoose.model("ShopifyShop", shopifyShopSchema);

export default ShopifyShop;
