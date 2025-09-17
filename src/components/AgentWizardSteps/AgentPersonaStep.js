"use client";

import React, { useState, useRef } from "react";
import {
  FiUser,
  FiPlay,
  FiPause,
  FiVolume2,
  FiMessageSquare,
} from "react-icons/fi";
import { useSession } from "next-auth/react";
// Section Separator Component
const SectionSeparator = () => (
  <div className="border-t-2 border-dashed border-gray-200 my-8"></div>
);

const AgentPersonaStep = ({ config, onUpdate, onVapiUpdate, errors = {} }) => {
  const [playingVoice, setPlayingVoice] = useState(null);
  const audioRefs = useRef({});
  const { data: session } = useSession();

  // Random name generator by gender
  const femaleNames = [
    "Emma",
    "Sarah",
    "Maya",
    "Sophia",
    "Luna",
    "Ava",
    "Isabella",
    "Charlotte",
    "Amelia",
    "Mia",
    "Harper",
    "Evelyn",
    "Abigail",
    "Emily",
    "Elizabeth",
    "Sofia",
    "Avery",
    "Ella",
    "Madison",
    "Scarlett",
    "Victoria",
    "Aria",
    "Grace",
    "Chloe",
    "Camila",
    "Penelope",
    "Olivia",
    "Sophie",
    "Lily",
    "Zoe",
    "Hannah",
    "Natalie",
    "Grace",
    "Ruby",
    "Stella",
    "Violet",
  ];

  const maleNames = [
    "Alex",
    "Ryan",
    "David",
    "James",
    "Michael",
    "Noah",
    "Liam",
    "William",
    "Benjamin",
    "Lucas",
    "Henry",
    "Alexander",
    "Mason",
    "Ethan",
    "Sebastian",
    "Jackson",
    "Aiden",
    "Matthew",
    "Samuel",
    "Joseph",
    "Levi",
    "Daniel",
    "Wyatt",
    "Owen",
    "Gabriel",
    "Oliver",
    "Lucas",
    "Mason",
    "Logan",
    "Caleb",
    "Nathan",
    "Isaac",
    "Luke",
    "Jack",
    "Connor",
    "Max",
    "Leo",
    "Theo",
  ];

  const generateRandomName = () => {
    // Determine gender based on selected voice
    const selectedVoice = voiceOptions.find(
      (voice) => voice.id === config.voiceName
    );
    const isMale = selectedVoice?.name.includes("(Male)");

    const nameList = isMale ? maleNames : femaleNames;
    const randomName = nameList[Math.floor(Math.random() * nameList.length)];
    return randomName;
  };

  const handleChange = (field, value) => {
    onUpdate({ [field]: value });
  };

  const handleVoiceChange = (voiceId, provider) => {
    // Update the agent persona
    onUpdate({
      voiceName: voiceId,
      voiceProvider: provider,
    });

    // Update the VAPI configuration separately
    if (onVapiUpdate) {
      onVapiUpdate({
        voice: {
          voiceId: voiceId,
          provider: provider,
        },
      });
    }
  };

  const handleNameChange = (name) => {
    // Extract email from config if available, or use a default
    const email = session.user.email || "user@example.com";
    const fullName = `${name} (${email})`;
    handleChange("agentName", fullName);
  };

  const getDisplayName = (fullName) => {
    if (!fullName) return "";
    // Extract just the name part before the email
    const match = fullName.match(/^([^(]+)/);
    return match ? match[1].trim() : fullName;
  };

  const toggleAudio = (voiceId) => {
    const audio = audioRefs.current[voiceId];

    if (playingVoice === voiceId) {
      // Currently playing this voice, pause it
      audio.pause();
      setPlayingVoice(null);
    } else {
      // Pause any currently playing audio and reset to beginning
      if (playingVoice && audioRefs.current[playingVoice]) {
        const currentAudio = audioRefs.current[playingVoice];
        currentAudio.pause();
        currentAudio.currentTime = 0; // Reset to beginning
      }

      // Reset the new audio to beginning and play
      audio.currentTime = 0; // Always start from beginning
      audio.play();
      setPlayingVoice(voiceId);
    }
  };

  const voiceOptions = [
    {
      id: "4NejU5DwQjevnR6mh3mb",
      name: "Ivaana (Female)",
      description: "Professional female voice",
      provider: "11labs",
      audioFile: "/us_female_1_voice.mp3",
    },
    {
      id: "7yaudeastruoyg3fksmu",
      name: "Alex (Female)",
      description: "Clear and confident female voice",
      provider: "11labs",
      audioFile: "/us_female_2_voice.mp3",
    },
    {
      id: "Kpie5hkocac7zmravpg1",
      name: "Ryan (Male)",
      description: "Professional male voice",
      provider: "11labs",
      audioFile: "/us_male_1_voice.mp3",
    },
  ];

  const greetingStyles = [
    {
      id: "standard",
      name: "Standard Professional",
      description: "Professional greeting with store and product details",
    },
    {
      id: "casual",
      name: "Casual",
      description: "Friendly and approachable tone",
    },
    {
      id: "custom",
      name: "Custom",
      description: "Define your own greeting style",
      hasInput: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Agent Persona Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Agent Persona
        </h2>
        <p className="text-sm text-gray-600">
          Personalize the agent with name, voice selection and greeting style
        </p>
      </div>

      {/* Agent Name Section */}
      <div className="space-y-4">
        <h3 className="text-base font-medium text-gray-900">Agent Name</h3>
        <p className="text-sm text-gray-600">
          Give your agent a name that customers will hear
        </p>
        <div className="">
          <div className="flex space-x-2">
            <input
              type="text"
              value={getDisplayName(config.agentName) || ""}
              onChange={(e) => handleNameChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Enter agent name (e.g., Emma, Sarah, Alex)"
            />
            <button
              type="button"
              onClick={() => handleNameChange(generateRandomName())}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded text-sm font-medium hover:bg-purple-200 transition-colors"
            >
              Random
            </button>
          </div>
        </div>
      </div>

      <SectionSeparator />

      {/* Voice Selection Section */}
      <div className="space-y-6">
        <h3 className="text-base font-medium text-gray-900">Voice Selection</h3>
        <p className="text-sm text-gray-600">Choose the voice for your agent</p>

        <div className="">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {voiceOptions.map((voice) => (
              <div
                key={voice.id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  config.voiceName === voice.id
                    ? "bg-purple-50 border-purple-400"
                    : "bg-gray-50 border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => {
                  handleVoiceChange(voice.id, voice.provider);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{voice.name}</h4>
                  <div className="flex items-center space-x-2">
                    <button
                      className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center hover:bg-purple-200 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAudio(voice.id);
                      }}
                    >
                      {playingVoice === voice.id ? (
                        <FiPause className="w-4 h-4 text-purple-600" />
                      ) : (
                        <FiPlay className="w-4 h-4 text-purple-600" />
                      )}
                    </button>
                    <input
                      type="radio"
                      name="voice"
                      checked={config.voiceName === voice.id}
                      onChange={() => {
                        handleVoiceChange(voice.id, voice.provider);
                      }}
                      className="w-4 h-4 text-purple-600"
                    />
                    <audio
                      ref={(el) => (audioRefs.current[voice.id] = el)}
                      src={voice.audioFile}
                      onEnded={() => setPlayingVoice(null)}
                      preload="metadata"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600">{voice.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionSeparator />

      {/* Greeting Style Section */}
      <div className="space-y-6">
        <h3 className="text-base font-medium text-gray-900">Greeting Style</h3>
        <p className="text-sm text-gray-600">
          Choose how your agent greets customers
        </p>

        <div className="">
          <div className="space-y-4">
            {greetingStyles.map((style) => {
              const isEnabled =
                config.greetingStyle?.[style.id]?.enabled || false;
              const template = config.greetingStyle?.[style.id]?.template || "";

              return (
                <div
                  key={style.id}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    isEnabled
                      ? "bg-purple-50 border-purple-400"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    // Set only this style as enabled, disable others
                    const newGreetingStyle = {
                      standard: {
                        enabled: false,
                        template:
                          config.greetingStyle?.standard?.template || "",
                      },
                      casual: {
                        enabled: false,
                        template: config.greetingStyle?.casual?.template || "",
                      },
                      custom: {
                        enabled: false,
                        template: config.greetingStyle?.custom?.template || "",
                      },
                    };
                    newGreetingStyle[style.id] = {
                      enabled: true,
                      template: template,
                    };
                    handleChange("greetingStyle", newGreetingStyle);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="greetingStyle"
                      checked={isEnabled}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          // Set only this style as enabled, disable others
                          const newGreetingStyle = {
                            standard: {
                              enabled: false,
                              template:
                                config.greetingStyle?.standard?.template || "",
                            },
                            casual: {
                              enabled: false,
                              template:
                                config.greetingStyle?.casual?.template || "",
                            },
                            custom: {
                              enabled: false,
                              template:
                                config.greetingStyle?.custom?.template || "",
                            },
                          };
                          newGreetingStyle[style.id] = {
                            enabled: true,
                            template: template,
                          };
                          handleChange("greetingStyle", newGreetingStyle);
                        }
                      }}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {style.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {style.description}
                      </p>
                      {isEnabled && (
                        <div className="mt-2">
                          <label className="block text-xs text-gray-600 mb-1">
                            Template:
                          </label>
                          <textarea
                            value={template}
                            onChange={(e) => {
                              const newGreetingStyle = {
                                ...config.greetingStyle,
                              };
                              newGreetingStyle[style.id] = {
                                ...newGreetingStyle[style.id],
                                template: e.target.value,
                              };
                              handleChange("greetingStyle", newGreetingStyle);
                            }}
                            className={`w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                              style.id === "custom"
                                ? "border-gray-300 bg-white"
                                : "border-gray-200 bg-gray-50"
                            }`}
                            placeholder={
                              style.id === "custom"
                                ? "Enter your greeting template here..."
                                : "This template cannot be edited"
                            }
                            rows={2}
                            readOnly={style.id !== "custom"}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPersonaStep;
