"use client";

import React from "react";
import { FiUser, FiGlobe, FiVolume2, FiMessageCircle } from "react-icons/fi";

const AgentPersonaStep = ({ config, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate({ [field]: value });
  };

  const voiceStyles = [
    {
      id: "sarah-professional-female",
      name: "Sarah - Professional Female",
      accent: "American",
      description: "Professional and friendly tone",
    },
    {
      id: "mike-friendly-male",
      name: "Mike - Friendly Male",
      accent: "American",
      description: "Warm and approachable",
    },
    {
      id: "emma-warm-female",
      name: "Emma - Warm Female",
      accent: "American",
      description: "Gentle and caring",
    },
    {
      id: "david-confident-male",
      name: "David - Confident Male",
      accent: "American",
      description: "Assured and authoritative",
    },
  ];

  const greetingStyles = [
    {
      id: "standard",
      name: "Standard (Recommended)",
      example:
        "Hi [Name], this is [Agent] from [Store]. I noticed you picked out [Product] but didn't get to checkout yet.",
    },
    {
      id: "casual",
      name: "Casual",
      example:
        "Hey [Name]! It's [Agent] from [Store]. Saw you were checking out some items - want to finish up real quick?",
    },
    {
      id: "custom",
      name: "Custom",
      example: "Write your own personalized greeting",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-base font-bold text-gray-900 mb-1">
          Agent Personality
        </h2>
        <p className="text-[11px] text-gray-500">
          Customize how your AI agent sounds and behaves
        </p>
      </div>

      {/* Agent Name Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          <FiUser className="w-4 h-4 mr-2" />
          <span className="text-sm">Agent Name</span>
        </h3>

        <input
          type="text"
          value={config.agentName}
          onChange={(e) => handleChange("agentName", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
          placeholder="e.g., Sarah, Mike, Emma"
        />
      </div>

      {/* Agent Language Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          <FiGlobe className="w-4 h-4 mr-2" />
          <span className="text-sm">Agent Language</span>
        </h3>

        <select
          value={config.language}
          onChange={(e) => handleChange("language", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
        >
          <option value="English (US)">English (US)</option>
          <option value="English (UK)">English (UK)</option>
          <option value="Spanish">Spanish</option>
          <option value="French">French</option>
          <option value="German">German</option>
          <option value="Italian">Italian</option>
          <option value="Portuguese">Portuguese</option>
          <option value="Hindi">Hindi</option>
          <option value="Chinese">Chinese</option>
          <option value="Japanese">Japanese</option>
        </select>
      </div>

      {/* Voice Style Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          <FiVolume2 className="w-4 h-4 mr-2" />
          <span className="text-sm">Voice Style</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {voiceStyles.map((voice) => (
            <div
              key={voice.id}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                config.voiceStyle === voice.id
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleChange("voiceStyle", voice.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-gray-900 text-sm">{voice.name}</h4>
                <button className="text-purple-600 hover:text-purple-700">
                  <FiVolume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-600">{voice.accent}</p>
              <p className="text-[11px] text-gray-500 mt-1">{voice.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Greeting Style Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          <FiMessageCircle className="w-4 h-4 mr-2" />
          <span className="text-sm">Greeting Style</span>
        </h3>

        <div className="space-y-3">
          {greetingStyles.map((style) => (
            <div
              key={style.id}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                config.greetingStyle === style.id
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleChange("greetingStyle", style.id)}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  name="greetingStyle"
                  checked={config.greetingStyle === style.id}
                  onChange={() => handleChange("greetingStyle", style.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1 text-sm">
                    {style.name}
                  </h4>
                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    "{style.example}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Greeting Input */}
        {config.greetingStyle === "custom" && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Greeting
            </label>
            <textarea
              value={config.customGreeting}
              onChange={(e) => handleChange("customGreeting", e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
              placeholder="Write your custom greeting here. You can use placeholders like [Name], [Agent], [Store], [Product]..."
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Available placeholders: [Name], [Agent], [Store], [Product],
              [CartValue]
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentPersonaStep;
