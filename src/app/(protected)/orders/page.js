"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FiShoppingCart,
  FiUser,
  FiMail,
  FiPhone,
  FiDollarSign,
  FiClock,
  FiRefreshCw,
} from "react-icons/fi";
import Toast from "@/components/Toast";
import WebhookStatus from "@/components/WebhookStatus";
import useShopStore from "@/stores/shopStore";

const OrdersPage = () => {
  const { data: session } = useSession();
  const { selectedShop } = useShopStore();
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({
    message: "",
    type: "info",
    isVisible: false,
  });

  const fetchAbandonedCarts = async () => {
    if (!selectedShop) {
      setError("No shop selected. Please select a shop from the sidebar.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/shopify/abandoned-carts?shop=${selectedShop.shop}&limit=50`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch abandoned carts");
      }

      setAbandonedCarts(data.data || []);
    } catch (err) {
      console.error("Error fetching abandoned carts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user && selectedShop) {
      fetchAbandonedCarts();
    }
  }, [session, selectedShop]);

  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCustomerInfo = (cart) => {
    if (cart.customer) {
      return {
        name: `${cart.customer.first_name || ""} ${
          cart.customer.last_name || ""
        }`.trim(),
        email: cart.customer.email,
        phone: cart.customer.phone,
      };
    }
    return {
      name: "Guest Customer",
      email: cart.email || "No email",
      phone: cart.phone || "No phone",
    };
  };

  if (!selectedShop) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
            <p className="text-gray-600">
              Manage your store orders and customer data
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a Shop
              </h3>
              <p className="text-gray-600">
                Please select a Shopify shop from the sidebar to view orders and
                abandoned carts
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
              <p className="text-gray-600">
                Manage your store orders and abandoned carts
                {selectedShop && (
                  <span className="ml-2 text-sm text-blue-600 font-medium">
                    • {selectedShop.shop.replace(".myshopify.com", "")}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={fetchAbandonedCarts}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              <FiRefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Webhook Status Section */}
        <div className="mb-6">
          <WebhookStatus user={session?.user} />
        </div>

        {/* Abandoned Carts Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <FiShoppingCart className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Abandoned Carts
                </h2>
                <p className="text-sm text-gray-600">
                  {abandonedCarts.length} abandoned carts found
                </p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2">
                <FiRefreshCw className="w-5 h-5 animate-spin text-gray-500" />
                <span className="text-gray-600">
                  Loading abandoned carts...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-red-600">⚠️</span>
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {!loading && !error && abandonedCarts.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <FiShoppingCart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Abandoned Carts
              </h3>
              <p className="text-gray-600">
                Great! All your customers are completing their purchases.
              </p>
            </div>
          )}

          {!loading && !error && abandonedCarts.length > 0 && (
            <div className="space-y-4">
              {abandonedCarts.map((cart, index) => {
                const customer = getCustomerInfo(cart);
                return (
                  <div
                    key={cart.id || index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <FiUser className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">
                              {customer.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiMail className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">
                              {customer.email}
                            </span>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-2">
                              <FiPhone className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">
                                {customer.phone}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <FiClock className="w-4 h-4" />
                            <span>
                              Abandoned: {formatDate(cart.updated_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FiDollarSign className="w-4 h-4" />
                            <span>
                              Total:{" "}
                              {formatCurrency(cart.total_price, cart.currency)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                          Abandoned
                        </span>
                      </div>
                    </div>

                    {/* Cart Items */}
                    {cart.line_items && cart.line_items.length > 0 && (
                      <div className="border-t border-gray-100 pt-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Cart Items ({cart.line_items.length})
                        </h4>
                        <div className="space-y-2">
                          {cart.line_items
                            .slice(0, 3)
                            .map((item, itemIndex) => (
                              <div
                                key={itemIndex}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                                  <span className="text-gray-900">
                                    {item.title} × {item.quantity}
                                  </span>
                                </div>
                                <span className="text-gray-600">
                                  {formatCurrency(item.price, cart.currency)}
                                </span>
                              </div>
                            ))}
                          {cart.line_items.length > 3 && (
                            <div className="text-sm text-gray-500">
                              +{cart.line_items.length - 3} more items
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </DashboardLayout>
  );
};

export default OrdersPage;
