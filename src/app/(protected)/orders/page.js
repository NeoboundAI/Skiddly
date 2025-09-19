"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCallIndex, setSelectedCallIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("All Customers");
  const [sortBy, setSortBy] = useState("Sort by Date");

  const [summary, setSummary] = useState({
    totalAbandoned: 0,
    totalValue: 0,
    avgCartValue: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(customerFilter !== "All Customers" && {
          customerType: customerFilter,
        }),
        sortBy:
          sortBy === "Sort by Date"
            ? "abandonedAt"
            : sortBy === "Sort by Value"
            ? "cartValue"
            : "abandonedAt",
        sortOrder: "desc",
      });

      const response = await fetch(`/api/orders?${params}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setSummary(data.summary);
        setPagination(data.pagination);
      } else {
        console.error("Failed to fetch orders:", data.error);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOrders();
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm, customerFilter, sortBy]);

  // Immediate effect for pagination
  useEffect(() => {
    fetchOrders();
  }, [pagination.page]);

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCustomerTypeColor = (type) => {
    switch (type) {
      case "NEW":
        return "bg-green-100 text-green-800";
      case "RETURNING":
        return "bg-blue-100 text-blue-800";
      case "VIP":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOrderStageColor = (stage) => {
    switch (stage) {
      case "abandoned":
        return "bg-orange-100 text-orange-800";
      case "contacted":
        return "bg-blue-100 text-blue-800";
      case "converted":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCallStageColor = (stage) => {
    switch (stage) {
      case "CALL COMPLETED":
        return "bg-green-100 text-green-800";
      case "CALL IN PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "DNP":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCallOutcomeColor = (outcome) => {
    switch (outcome) {
      case "DISCOUNT SHARED":
        return "bg-orange-100 text-orange-800";
      case "NO ANSWER":
        return "bg-red-100 text-red-800";
      case "FREE SHIPPING ADDED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setSelectedCallIndex(0); // Show latest call first
  };

  const closeSlider = () => {
    setSelectedOrder(null);
    setSelectedCallIndex(0);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 bg-white min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl font-bold text-gray-900">
              {summary.totalAbandoned}
            </div>
            <div className="text-sm text-gray-600">Total Abandoned</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(summary.totalValue)}
            </div>
            <div className="text-sm text-gray-600">Total Value</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(summary.avgCartValue)}
            </div>
            <div className="text-sm text-gray-600">Avg Cart Value</div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by customer name, email, or checkout ID..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on search
                }}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            >
              <option value="All Customers">All Customers</option>
              <option value="New">New</option>
              <option value="Returning">Returning</option>
              <option value="VIP">VIP</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="Sort by Date">Sort by Date</option>
              <option value="Sort by Value">Sort by Value</option>
              <option value="Sort by Name">Sort by Name</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CUSTOMER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CART VALUE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ITEMS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CUSTOMER TYPE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LOCATION
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ABANDONED
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CALL TIME
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ORDER STAGE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CALL STAGE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CALL OUTCOME
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CALL ATTEMPTS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CALL END REASON
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LAST PICKED
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CALL DURATION
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleOrderClick(order)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customer.email}
                        </div>
                        <div className="text-sm text-gray-500">{order.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(order.cartValue, order.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.items.length} items
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items.map((item) => item.title).join(", ")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCustomerTypeColor(
                          order.customerType
                        )}`}
                      >
                        {order.customerType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.location.city}, {order.location.state}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.location.country}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(order.abandonedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.calls.length > 0
                        ? formatDate(order.calls[0].date)
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStageColor(
                          order.orderStage
                        )}`}
                      >
                        {order.orderStage.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCallStageColor(
                          order.callStage
                        )}`}
                      >
                        {order.callStage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCallOutcomeColor(
                          order.callOutcome
                        )}`}
                      >
                        {order.callOutcome}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${
                          order.callAttempts > 2
                            ? "text-red-600"
                            : order.callAttempts > 1
                            ? "text-orange-600"
                            : "text-blue-600"
                        }`}
                      >
                        {order.callAttempts}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.callEndReason
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.lastPicked}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-green-600">
                        {order.callDuration}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(prev.pages, prev.page + 1),
                    }))
                  }
                  disabled={pagination.page === pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}
                    </span>{" "}
                    of <span className="font-medium">{pagination.total}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page - 1),
                        }))
                      }
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {/* Page numbers */}
                    {Array.from(
                      { length: Math.min(5, pagination.pages) },
                      (_, i) => {
                        const pageNum =
                          Math.max(
                            1,
                            Math.min(pagination.pages - 4, pagination.page - 2)
                          ) + i;
                        if (pageNum > pagination.pages) return null;

                        return (
                          <button
                            key={pageNum}
                            onClick={() =>
                              setPagination((prev) => ({
                                ...prev,
                                page: pageNum,
                              }))
                            }
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === pagination.page
                                ? "z-10 bg-purple-50 border-purple-500 text-purple-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}

                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.pages, prev.page + 1),
                        }))
                      }
                      disabled={pagination.page === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Slider */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={closeSlider}
            ></div>
            <div className="absolute right-0 top-0 h-full w-1/2 bg-white shadow-xl">
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedOrder.calls[selectedCallIndex]?.callId} -{" "}
                      {formatDate(selectedOrder.calls[selectedCallIndex]?.date)}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Call ID: {selectedOrder.calls[selectedCallIndex]?.id}
                    </p>
                    <p className="text-sm text-gray-500">
                      Duration:{" "}
                      {selectedOrder.calls[selectedCallIndex]?.duration}
                    </p>
                  </div>
                  <button
                    onClick={closeSlider}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Call Navigation */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex space-x-2">
                    {selectedOrder.calls.map((call, index) => (
                      <button
                        key={call.id}
                        onClick={() => setSelectedCallIndex(index)}
                        className={`px-3 py-1 text-sm font-medium rounded-md ${
                          selectedCallIndex === index
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {call.callId}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Call Details */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Call Insights */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">
                        Call Insights
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">
                            Call Status
                          </div>
                          <div
                            className={`text-sm font-medium ${
                              selectedOrder.calls[selectedCallIndex]?.status ===
                              "Failed"
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {selectedOrder.calls[selectedCallIndex]?.status}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Duration</div>
                          <div className="text-sm font-medium text-gray-900">
                            {selectedOrder.calls[selectedCallIndex]?.duration}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">
                            Next Action
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            Complete
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">
                            Meeting Blocked
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            No
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">
                        Additional Details
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">
                            Category Mismatch
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            No
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">
                            Already Purchased
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            No
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">
                            Not Interested
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            No
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Tabs */}
                    <div>
                      <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                          <button className="py-2 px-1 border-b-2 border-purple-500 text-sm font-medium text-purple-600">
                            Summary
                          </button>
                          <button className="py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            Transcript
                          </button>
                          <button className="py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            Call Recording
                          </button>
                        </nav>
                      </div>
                      <div className="mt-4">
                        <div className="text-sm text-gray-700">
                          {selectedOrder.calls[selectedCallIndex]?.transcript ||
                            "No transcript available for this call. The call ended without being answered by the customer."}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
