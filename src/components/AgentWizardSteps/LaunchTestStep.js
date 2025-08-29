"use client";

import React from "react";
import {
  FiPlay,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiSettings,
  FiBarChart2,
} from "react-icons/fi";

const LaunchTestStep = ({ config, onUpdate, onSave, loading }) => {
  const handleChange = (field, value) => {
    onUpdate({ [field]: value });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "validated":
        return "text-green-600 bg-green-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-yellow-600 bg-yellow-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "validated":
        return FiCheckCircle;
      case "failed":
        return FiAlertTriangle;
      default:
        return FiClock;
    }
  };

  const getDeploymentStatusColor = (status) => {
    switch (status) {
      case "live":
        return "text-green-600 bg-green-100";
      case "testing":
        return "text-blue-600 bg-blue-100";
      case "paused":
        return "text-orange-600 bg-orange-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      <div className="text-center mb-3">
        <h2 className="text-base font-bold text-gray-900 mb-0.5">Launch & Test</h2>
        <p className="text-xs text-gray-600">
          Run test calls, validate the configured flows, and deploy the live agent
        </p>
      </div>

      {/* Validation Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <FiCheckCircle className="w-4 h-4 mr-2" />
          Validation Status
        </h3>

        <div className="flex items-center space-x-3 mb-3">
          <div
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              config.validationStatus
            )}`}
          >
            <div className="flex items-center space-x-1.5">
              {React.createElement(getStatusIcon(config.validationStatus), {
                className: "w-3.5 h-3.5",
              })}
              <span className="capitalize">{config.validationStatus}</span>
            </div>
          </div>

          <button
            onClick={() => handleChange("validationStatus", "validated")}
            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs"
          >
            Run Validation
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">
              {config.testCallsCompleted}
            </div>
            <div className="text-xs text-gray-600">Test Calls</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">✓</div>
            <div className="text-xs text-gray-600">Configuration</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">✓</div>
            <div className="text-xs text-gray-600">Integration</div>
          </div>
        </div>
      </div>

      {/* Test Calls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <FiPlay className="w-4 h-4 mr-2" />
          Test Calls
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-900 text-xs">Test Call #1</h4>
              <p className="text-xs text-gray-600">
                Verify agent greeting and basic flow
              </p>
            </div>
            <button className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs">
              Start Test
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-900 text-xs">Test Call #2</h4>
              <p className="text-xs text-gray-600">
                Test objection handling responses
              </p>
            </div>
            <button className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs">
              Start Test
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-900 text-xs">Test Call #3</h4>
              <p className="text-xs text-gray-600">
                Validate discount and offer logic
              </p>
            </div>
            <button className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs">
              Start Test
            </button>
          </div>
        </div>
      </div>

      {/* Deployment Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <FiSettings className="w-4 h-4 mr-2" />
          Deployment Status
        </h3>

        <div className="flex items-center justify-between mb-3">
          <div>
            <div
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDeploymentStatusColor(
                config.deploymentStatus
              )}`}
            >
              <span className="capitalize">{config.deploymentStatus}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {config.deploymentStatus === "draft" &&
                "Agent is in draft mode and not making calls"}
              {config.deploymentStatus === "testing" &&
                "Agent is in testing mode with limited calls"}
              {config.deploymentStatus === "live" &&
                "Agent is live and making calls to customers"}
              {config.deploymentStatus === "paused" &&
                "Agent is paused and not making calls"}
            </p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => handleChange("deploymentStatus", "testing")}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
            >
              Deploy to Testing
            </button>
            <button
              onClick={() => handleChange("deploymentStatus", "live")}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
            >
              Go Live
            </button>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <FiBarChart2 className="w-4 h-4 mr-2" />
          Test Results
        </h3>

        {config.testResults && config.testResults.length > 0 ? (
          <div className="space-y-2">
            {config.testResults.map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg"
              >
                <div>
                  <h4 className="font-semibold text-gray-900 text-xs">
                    {result.testType}
                  </h4>
                  <p className="text-xs text-gray-600">{result.notes}</p>
                  <p className="text-[10px] text-gray-500">
                    {new Date(result.timestamp).toLocaleString()}
                  </p>
                </div>
                <div
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    result.status === "passed"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {result.status}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <FiBarChart2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-xs">No test results yet. Run some test calls to see results here.</p>
          </div>
        )}
      </div>

      {/* Final Actions */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">
          Ready to Launch?
        </h3>
        <p className="text-xs text-blue-700 mb-3">
          Your agent configuration is complete! Review all settings and click
          the button below to save and deploy your agent.
        </p>

        <div className="flex space-x-3">
          <button
            onClick={onSave}
            disabled={loading}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-xs"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FiCheckCircle className="w-3.5 h-3.5" />
                <span>Save & Deploy Agent</span>
              </>
            )}
          </button>

          <button className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs">
            Save as Draft
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaunchTestStep;
