"use client";

import { useState, useEffect } from "react";
import {
  FaShoppingCart,
  FaPhone,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaEye,
  FaSync,
  FaCalendar,
  FaUser,
  FaDollarSign,
  FaBox,
  FaSearch,
  FaFilter,
  FaDownload,
} from "react-icons/fa";
import DashboardLayout from "@/components/DashboardLayout";
export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("abandoned");
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [waitingCarts, setWaitingCarts] = useState([]);
  const [callQueue, setCallQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCart, setSelectedCart] = useState(null);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Customers");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch abandoned carts
      const abandonedResponse = await fetch("/api/abandoned-carts");
      const abandonedData = await abandonedResponse.json();
      if (abandonedData.success) {
        setAbandonedCarts(abandonedData.carts);
      }

      // Fetch waiting carts
      const waitingResponse = await fetch("/api/waiting-carts");
      const waitingData = await waitingResponse.json();
      if (waitingData.success) {
        setWaitingCarts(waitingData.carts);
      }

      // Fetch call queue
      const queueResponse = await fetch("/api/call-queue");
      const queueData = await queueResponse.json();
      if (queueData.success) {
        setCallQueue(queueData.calls);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      "ASSIGNED TO AGENT": { color: "bg-orange-100 text-orange-800" },
      CONTACTED: { color: "bg-blue-100 text-blue-800" },
      CONVERTED: { color: "bg-green-100 text-green-800" },
      RESCHEDULED: { color: "bg-yellow-100 text-yellow-800" },
      waiting: { color: "bg-gray-100 text-gray-800" },
      queued: { color: "bg-blue-100 text-blue-800" },
    };

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {status}
      </span>
    );
  };

  const getCallOutcomeBadge = (outcome) => {
    const outcomeConfig = {
      "DISCOUNT SHARED": { color: "bg-green-100 text-green-800" },
      "NOT INTERESTED": { color: "bg-red-100 text-red-800" },
      "FREE SHIPPING ADDED": { color: "bg-blue-100 text-blue-800" },
      "CALL COMPLETED": { color: "bg-gray-100 text-gray-800" },
      DNI: { color: "bg-yellow-100 text-yellow-800" },
      "CALL IN PROGRESS": { color: "bg-purple-100 text-purple-800" },
    };

    const config = outcomeConfig[outcome] || {
      color: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {outcome}
      </span>
    );
  };

  const CallHistoryModal = () => {
    if (!showCallHistory || !selectedCart) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Call History - {selectedCart.customerName}
              </h2>
              <p className="text-sm text-gray-600">
                Cart #{selectedCart.shopifyCheckoutId}
              </p>
            </div>
            <button
              onClick={() => setShowCallHistory(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimesCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Customer</p>
                <p className="text-sm text-gray-900">
                  {selectedCart.customerName}
                </p>
                <p className="text-xs text-gray-600">
                  {selectedCart.customerEmail}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Cart Value</p>
                <p className="text-sm text-gray-900">
                  {formatCurrency(selectedCart.cartValue)}
                </p>
                <p className="text-xs text-gray-600">
                  {selectedCart.items} items
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Total Attempts
                </p>
                <p className="text-sm text-gray-900">
                  {selectedCart.totalAttempts}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Location</p>
                <p className="text-sm text-gray-900">{selectedCart.location}</p>
              </div>
            </div>

            {selectedCart.callHistory && selectedCart.callHistory.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Call History ({selectedCart.callHistory.length} calls)
                </h3>
                {selectedCart.callHistory.map((call, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <FaPhone className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-900">
                          Call #{index + 1}
                        </span>
                        {getCallOutcomeBadge(call.outcome)}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(call.timestamp)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <p className="font-medium text-gray-700">Duration</p>
                        <p className="text-gray-900">
                          {call.duration
                            ? `${Math.floor(call.duration / 60)}:${String(
                                call.duration % 60
                              ).padStart(2, "0")}`
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Next Action</p>
                        <p className="text-gray-900">
                          {call.nextAction || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">End Reason</p>
                        <p className="text-gray-900">
                          {call.callStats?.ended_reason || "N/A"}
                        </p>
                      </div>
                    </div>

                    {call.callStats && (
                      <div className="space-y-3">
                        {call.callStats.transcript && (
                          <div>
                            <p className="font-medium text-gray-700 mb-1">
                              Transcript:
                            </p>
                            <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 max-h-32 overflow-y-auto">
                              {call.callStats.transcript}
                            </div>
                          </div>
                        )}
                        {call.callStats.summary && (
                          <div>
                            <p className="font-medium text-gray-700 mb-1">
                              Summary:
                            </p>
                            <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                              {call.callStats.summary}
                            </div>
                          </div>
                        )}
                        {call.callStats.recordingUrl && (
                          <div>
                            <p className="font-medium text-gray-700 mb-1">
                              Recording:
                            </p>
                            <a
                              href={call.callStats.recordingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <FaPhone className="w-3 h-3" />
                              Listen to Recording
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaPhone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No call history available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="flex items-center justify-center h-64">
            <FaSync className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading orders...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Abandoned Cart Recovery
                </h1>
                <div className="flex items-center gap-6 mt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {abandonedCarts.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Abandoned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(
                        abandonedCarts.reduce(
                          (sum, cart) => sum + cart.cartValue,
                          0
                        )
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Total Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(
                        abandonedCarts.reduce(
                          (sum, cart) => sum + cart.cartValue,
                          0
                        ) / abandonedCarts.length || 0
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Avg Cart Value</div>
                  </div>
                </div>
              </div>
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FaSync className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by customer name, email, or checkout ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option>All Customers</option>
                <option>ASSIGNED TO AGENT</option>
                <option>CONTACTED</option>
                <option>CONVERTED</option>
                <option>RESCHEDULED</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <FaFilter className="w-4 h-4" />
                Filter
              </button>
              <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <FaDownload className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                {
                  id: "abandoned",
                  label: "Abandoned Carts",
                  count: abandonedCarts.length,
                  icon: FaShoppingCart,
                },
                {
                  id: "waiting",
                  label: "Waiting Carts",
                  count: waitingCarts.length,
                  icon: FaClock,
                },
                {
                  id: "queue",
                  label: "Call Queue",
                  count: callQueue.length,
                  icon: FaPhone,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {activeTab === "abandoned" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cart Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Abandoned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Call Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Stage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Call Stage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Call Outcome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Call Attempts
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Call End Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Picked
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Call Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {abandonedCarts.length > 0 ? (
                      abandonedCarts.map((cart) => (
                        <tr key={cart._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {cart.customerName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {cart.customerEmail}
                              </div>
                              <div className="text-xs text-gray-400">
                                #{cart.shopifyCheckoutId}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(cart.cartValue)}
                            </div>
                            <div className="text-xs text-gray-500">WELCOME</div>
                            <div className="text-xs text-red-500">
                              (-$17.08)
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {cart.items} Items
                            </div>
                            <div className="text-xs text-gray-500">
                              Wellness Houseware
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                cart.customerType === "RETURNING"
                                  ? "bg-blue-100 text-blue-800"
                                  : cart.customerType === "NEW"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {cart.customerType}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              3 orders
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {cart.location}
                            </div>
                            <div className="text-xs text-gray-500">
                              United States
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(cart.abandonedAt).split(",")[0]}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(cart.abandonedAt).split(",")[1]}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {cart.lastPicked
                                ? formatDate(cart.lastPicked).split(",")[1]
                                : "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {cart.lastPicked
                                ? formatDate(cart.lastPicked).split(",")[0]
                                : ""}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(cart.orderStage)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getCallOutcomeBadge(cart.callStage)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getCallOutcomeBadge(cart.callOutcome)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {cart.callAttempts}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {cart.callEndReason}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {cart.lastPicked
                                ? formatDate(cart.lastPicked).split(",")[1]
                                : "Never"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {cart.lastPicked
                                ? formatDate(cart.lastPicked).split(",")[0]
                                : ""}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {cart.callDuration || "N/A"}
                            </div>
                            {cart.callDuration && (
                              <div className="w-4 h-4 bg-green-400 rounded-full inline-block ml-2"></div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedCart(cart);
                                setShowCallHistory(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="15"
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          <FaShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No abandoned carts found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "waiting" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cart Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Next Call
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {waitingCarts.length > 0 ? (
                      waitingCarts.map((cart) => (
                        <tr key={cart._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {cart.customerName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {cart.customerPhone}
                              </div>
                              <div className="text-xs text-gray-400">
                                #{cart.shopifyCheckoutId}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(cart.cartValue)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {cart.items} Items
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(cart.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(cart.nextCallTime)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(cart.orderStage)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          <FaClock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No waiting carts found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "queue" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Call ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cart ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scheduled For
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attempt #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {callQueue.length > 0 ? (
                      callQueue.map((call) => (
                        <tr key={call._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {call.callId}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {call.customerNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {call.cartId}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(call.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(call.nextCallTime)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {call.attemptNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(call.createdAt)}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          <FaPhone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No calls in queue</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <CallHistoryModal />
      </div>
    </DashboardLayout>
  );
}
