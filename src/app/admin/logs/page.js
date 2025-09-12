"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useAdminLogs } from "@/hooks/useAdmin";
import useAdminStore from "@/stores/adminStore";
import {
  FiRefreshCw,
  FiFilter,
  FiDownload,
  FiUser,
  FiMail,
  FiCalendar,
  FiHash,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

export default function AdminLogs() {
  const { logs, logsLoading, logsError, filters, pagination, summary } =
    useAdminStore();

  const { updateFilter, clearFilters, nextPage, prevPage, setPage, setLimit } =
    useAdminStore();

  const { refetch } = useAdminLogs();

  // State to track which stack traces are expanded
  const [expandedStacks, setExpandedStacks] = useState(new Set());

  // Auto-fetch logs when filters change
  useEffect(() => {
    refetch();
  }, [filters]);

  const handleRefresh = () => {
    refetch();
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        // If the date is invalid, try to parse it manually
        const parts = timestamp.split(/[- :]/);
        if (parts.length >= 6) {
          const [year, month, day, hour, minute, second] = parts;
          const ms = parts[6] || "000";
          const newDate = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(minute),
            parseInt(second),
            parseInt(ms)
          );
          if (!isNaN(newDate.getTime())) {
            return newDate.toLocaleString();
          }
        }
        return "Invalid Date";
      }
      return date.toLocaleString();
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Helper function to truncate stack trace
  const truncateStack = (stack, maxLines = 3) => {
    if (!stack) return null;
    const lines = stack.split("\n");
    if (lines.length <= maxLines) return stack;
    return lines.slice(0, maxLines).join("\n") + "\n...";
  };

  // Helper function to toggle stack trace expansion
  const toggleStackExpansion = (logIndex) => {
    const newExpanded = new Set(expandedStacks);
    if (newExpanded.has(logIndex)) {
      newExpanded.delete(logIndex);
    } else {
      newExpanded.add(logIndex);
    }
    setExpandedStacks(newExpanded);
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "warn":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "http":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "debug":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const exportLogs = () => {
    const csvContent = [
      "Timestamp,Level,Message,User Email,User ID,Path,Method,StatusCode,Event,Operation,Model,Service,Error,Stack",
      ...logs.map(
        (log) =>
          `"${log.timestamp}","${log.level}","${log.message.replace(
            /"/g,
            '""'
          )}","${log.userEmail || ""}","${log.userId || ""}","${
            log.path || ""
          }","${log.method || ""}","${log.statusCode || ""}","${
            log.event || ""
          }","${log.operation || ""}","${log.model || ""}","${
            log.service || ""
          }","${log.error || ""}","${log.stack || ""}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFilterChange = (key, value) => {
    updateFilter(key, value);
    // Reset to first page when filters change
    if (key !== "page" && key !== "limit") {
      setPage(1);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Application Logs
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {summary.totalEntries} total entries across {summary.totalFiles}{" "}
              files
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleRefresh}
              disabled={logsLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <FiRefreshCw
                className={`h-4 w-4 mr-2 ${logsLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={exportLogs}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiDownload className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-4 flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <FiFilter className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Filters:
              </span>
            </div>

            <select
              value={filters.level}
              onChange={(e) => handleFilterChange("level", e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="">All Levels</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="http">HTTP</option>
              <option value="debug">Debug</option>
            </select>

            <div className="flex items-center space-x-1">
              <FiMail className="h-4 w-4 text-gray-400" />
              <input
                type="email"
                placeholder="Filter by email..."
                value={filters.userEmail}
                onChange={(e) =>
                  handleFilterChange("userEmail", e.target.value)
                }
                className="border border-gray-300 rounded-md px-3 py-1 text-sm w-48"
              />
            </div>

            <div className="flex items-center space-x-1">
              <FiHash className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by user ID..."
                value={filters.userId}
                onChange={(e) => handleFilterChange("userId", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm w-48"
              />
            </div>

            <div className="flex items-center space-x-1">
              <FiCalendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange("date", e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              />
            </div>

            <input
              type="text"
              placeholder="Search messages..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm w-64"
            />

            <select
              value={filters.limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value={200}>200 per page</option>
              <option value={500}>500 per page</option>
            </select>

            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {logsError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3">
              {logsError}
            </div>
          )}

          {logsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      API Path
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        {summary.totalEntries === 0
                          ? "No logs found"
                          : "No logs match your filters"}
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getLevelColor(
                              log.level
                            )}`}
                          >
                            {log.level.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                          <div className="truncate" title={log.message}>
                            {log.message}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.userEmail ? (
                            <div>
                              <div className="flex items-center space-x-1">
                                <FiUser className="h-3 w-3 text-gray-400" />
                                <span className="font-medium">
                                  {log.userEmail}
                                </span>
                              </div>
                              {log.userId && (
                                <div className="text-xs text-gray-500 mt-1">
                                  ID: {log.userId}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.path ? (
                            <div>
                              <div className="font-mono text-xs">
                                {log.method} {log.path}
                              </div>
                              {log.statusCode && (
                                <span
                                  className={`text-xs px-1 py-0.5 rounded ${
                                    log.statusCode >= 400
                                      ? "bg-red-100 text-red-800"
                                      : log.statusCode >= 300
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {log.statusCode}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="space-y-1">
                            {log.event && (
                              <div className="text-xs">
                                <span className="font-medium">Event:</span>{" "}
                                {log.event}
                              </div>
                            )}
                            {log.operation && log.model && (
                              <div className="text-xs">
                                <span className="font-medium">DB:</span>{" "}
                                {log.operation} {log.model}
                              </div>
                            )}
                            {log.duration && (
                              <div className="text-xs">
                                <span className="font-medium">Duration:</span>{" "}
                                {log.duration}
                              </div>
                            )}
                            {log.error && (
                              <div className="text-xs text-red-600">
                                <span className="font-medium">Error:</span>{" "}
                                {log.error}
                              </div>
                            )}
                            {log.stack && (
                              <div className="text-xs">
                                <button
                                  onClick={() => toggleStackExpansion(index)}
                                  className="flex items-center space-x-1 text-red-600 hover:text-red-800 font-medium"
                                >
                                  {expandedStacks.has(index) ? (
                                    <FiChevronUp className="h-3 w-3" />
                                  ) : (
                                    <FiChevronDown className="h-3 w-3" />
                                  )}
                                  <span>Stack Trace</span>
                                </button>
                                <div className="mt-1">
                                  <pre className="text-xs bg-gray-50 p-2 rounded border font-mono whitespace-pre-wrap text-gray-700 max-h-32 overflow-y-auto">
                                    {expandedStacks.has(index)
                                      ? log.stack
                                      : truncateStack(log.stack, 3)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={prevPage}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={nextPage}
                disabled={!pagination.hasNext}
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
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={prevPage}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page numbers */}
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === pagination.page
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}

                  <button
                    onClick={nextPage}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-500 text-center">
          Showing {logs.length} of {summary.filteredEntries} filtered entries
          {summary.totalEntries !== summary.filteredEntries && (
            <span> (from {summary.totalEntries} total entries)</span>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
