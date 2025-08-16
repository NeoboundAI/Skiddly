import crypto from "crypto";

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_SCOPES =
  process.env.SHOPIFY_SCOPES || "read_products,read_orders,read_customers";
const SHOPIFY_REDIRECT_URI =
  process.env.SHOPIFY_REDIRECT_URI ||
  `${process.env.NEXTAUTH_URL}/api/shopify/callback`;

export function generateShopifyAuthUrl(shop) {
  const nonce = crypto.randomBytes(16).toString("hex");
  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: SHOPIFY_API_KEY,
    scope: SHOPIFY_SCOPES,
    redirect_uri: SHOPIFY_REDIRECT_URI,
    state: state,
    "grant_options[]": "per-user",
  });

  return {
    url: `https://${shop}/admin/oauth/authorize?${params.toString()}`,
    state: state,
    nonce: nonce,
  };
}

export async function exchangeCodeForToken(shop, code) {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code: code,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange code for token");
  }

  return response.json();
}

export async function verifyShopifyWebhook(data, hmacHeader) {
  const hmac = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(data, "utf8")
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(hmac, "base64"),
    Buffer.from(hmacHeader, "base64")
  );
}

export async function shopifyGraphqlRequest(
  shop,
  accessToken,
  query,
  variables = {}
) {
  const url = `https://${shop}/admin/api/2025-07/graphql.json`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (!response.ok || json.errors) {
    throw new Error(
      `Shopify GraphQL error: ${JSON.stringify(json.errors || json)}`
    );
  }

  return json.data;
}

export async function getShopifyOrders(shop, accessToken, limit = 50) {
  const query = `
    query getOrders($first: Int!) {
      orders(first: $first, query: "status:open") {
        edges {
          node {
            id
            name
            email
            phone
            createdAt
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            customer {
              id
              firstName
              lastName
              email
              phone
            }
            lineItems(first: 10) {
              edges {
                node {
                  id
                  title
                  quantity
                  variant {
                    id
                    title
                    price
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  return shopifyGraphqlRequest(shop, accessToken, query, { first: limit });
}

export async function getShopifyProducts(shop, accessToken, limit = 50) {
  const query = `
    query getProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            description
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price
                  availableForSale
                }
              }
            }
          }
        }
      }
    }
  `;

  return shopifyGraphqlRequest(shop, accessToken, query, { first: limit });
}
