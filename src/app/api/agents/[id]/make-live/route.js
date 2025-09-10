import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { VapiClient } from "@vapi-ai/server-sdk";
import connectDB from "@/lib/mongodb";
import Agent from "@/models/Agent";
import {
  logApiError,
  logApiSuccess,
  logAuthFailure,
  logExternalApi,
  logExternalApiError,
} from "@/lib/apiLogger";

// Function to prepare VAPI configuration with agent-specific data
function prepareVapiConfiguration(agent) {
  const vapiConfig = { ...agent.vapiConfiguration };

  // Update voice configuration from agentPersona
  if (agent.agentPersona) {
    vapiConfig.voice = {
      ...vapiConfig.voice,
      voiceId: agent.agentPersona.voiceName,
      provider: agent.agentPersona.voiceProvider,
    };
  }

  // Update model messages with greeting style and objection handling
  let updatedContent = null;
  if (vapiConfig.model && vapiConfig.model.messages) {
    const systemMessage = vapiConfig.model.messages.find(
      (msg) => msg.role === "system"
    );
    if (systemMessage) {
      updatedContent = systemMessage.content;

      // Update greeting template based on enabled greeting style
      if (agent.agentPersona && agent.agentPersona.greetingStyle) {
        const greetingStyle = agent.agentPersona.greetingStyle;
        let greetingTemplate = "";

        if (greetingStyle.standard && greetingStyle.standard.enabled) {
          greetingTemplate = greetingStyle.standard.template;
        } else if (greetingStyle.casual && greetingStyle.casual.enabled) {
          greetingTemplate = greetingStyle.casual.template;
        } else if (greetingStyle.custom && greetingStyle.custom.enabled) {
          greetingTemplate = greetingStyle.custom.template;
        }

        if (greetingTemplate) {
          // Replace the greeting template in the content
          updatedContent = updatedContent.replace(
            /Greeting & Context:\s*\n"([^"]+)"/,
            `Greeting & Context:\n"${greetingTemplate}"`
          );
        }
      }

      // Update objection handling responses
      if (agent.objectionHandling) {
        const objectionMappings = {
          "Shipping Cost Concern": "A. [Shipping Cost Concern:]",
          "Price Concern": "B. [Price Concern:]",
          "Size/Fit Doubts (for fashion/apparel)":
            "C. [Size/Fit Doubts (for fashion/apparel):]",
          "Payment Issue": "D. [Payment Issue:]",
          "Just Forgot / Got Busy": "E. [Just Forgot / Got Busy:]",
          "Technical Issues": "F. [Technical Issues:]",
          "Product Questions/Uncertainty":
            "G. [Product Questions/Uncertainty:]",
          "Comparison Shopping": "H. [Comparison Shopping:]",
          "Wrong Item/Changed Mind": "I. [Wrong Item/Changed Mind:]",
        };

        Object.keys(agent.objectionHandling).forEach((objectionKey) => {
          const objection = agent.objectionHandling[objectionKey];
          const vapiKey = objectionMappings[objectionKey];

          if (objection && vapiKey) {
            if (objection.enabled) {
              // Objection is enabled - add or update it
              let responseText = "";

              // Priority: customEnabled takes precedence over defaultEnabled
              if (
                objection.customEnabled &&
                objection.custom &&
                objection.custom.trim()
              ) {
                responseText = objection.custom.trim();
              } else if (
                objection.defaultEnabled &&
                objection.default &&
                objection.default.trim()
              ) {
                responseText = objection.default.trim();
              }

              if (responseText) {
                // Check if this objection already exists in the content
                const escapedVapiKey = vapiKey.replace(
                  /[.*+?^${}()|[\]\\]/g,
                  "\\$&"
                );
                const existingRegex = new RegExp(
                  `${escapedVapiKey}\\s*\\n--\\s*\\n"([^"]+)"\\s*\\n--`,
                  "g"
                );

                if (existingRegex.test(updatedContent)) {
                  // Replace existing objection
                  updatedContent = updatedContent.replace(
                    existingRegex,
                    `${vapiKey}\n--\n"${responseText}"\n--`
                  );
                } else {
                  // Add new objection - find the OBJECTION HANDLING RESPONSES section and add it
                  const objectionSectionRegex =
                    /(OBJECTION HANDLING RESPONSES:\s*\n)(.*?)(\n\nClosing & Follow-Up:)/s;
                  const match = updatedContent.match(objectionSectionRegex);

                  if (match) {
                    const beforeSection = match[1];
                    let existingObjections = match[2];
                    const afterSection = match[3];

                    // Ensure existing objections end with proper spacing
                    if (!existingObjections.endsWith("\n\n")) {
                      existingObjections =
                        existingObjections.trimEnd() + "\n\n";
                    }

                    // Add the new objection with proper formatting
                    const newObjection = `${vapiKey}\n--\n"${responseText}"\n--\n\n`;
                    const updatedObjections = existingObjections + newObjection;

                    updatedContent = updatedContent.replace(
                      objectionSectionRegex,
                      `${beforeSection}${updatedObjections}${afterSection}`
                    );
                  }
                }
              }
            } else {
              // Objection is disabled - remove only the content inside -- markers, keep the header
              const escapedVapiKey = vapiKey.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              );
              const regex = new RegExp(
                `(${escapedVapiKey}\\s*\\n)--\\s*\\n"([^"]+)"\\s*\\n--`,
                "g"
              );

              updatedContent = updatedContent.replace(
                regex,
                '$1--\n"[DISABLED]"\n--'
              );
            }
          }
        });
      }

      // Update the system message content
      systemMessage.content = updatedContent;
    }

    // Update the vapiConfig with the modified content
    if (updatedContent) {
      vapiConfig.model.messages = vapiConfig.model.messages.map((msg) => {
        if (msg.role === "system") {
          return { ...msg, content: updatedContent };
        }
        return msg;
      });
    }
  }

  return vapiConfig;
}

export async function POST(request, { params }) {
  let session = null;
  try {
    const { id } = await params;

    // Get user session
    session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      logAuthFailure(
        "POST",
        `/api/agents/${id}/make-live`,
        null,
        "No session or user email"
      );
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { selectedPhoneNumber } = body;

    if (!selectedPhoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Get the agent
    const agent = await Agent.findById(id);
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Check if user owns the agent
    if (agent.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if agent has vapiConfiguration
    if (!agent.vapiConfiguration) {
      return NextResponse.json(
        { error: "Agent VAPI configuration not found" },
        { status: 400 }
      );
    }

    // Initialize VAPI client
    const client = new VapiClient({
      token: process.env.VAPI_API_KEY,
    });

    // Prepare VAPI configuration with agent-specific data
    const preparedVapiConfig = prepareVapiConfiguration(agent);

    // Update the agent with the prepared VAPI configuration
    await Agent.findByIdAndUpdate(id, {
      vapiConfiguration: preparedVapiConfig,
    });

    let assistantId = agent.assistantId;

    // Create or update VAPI assistant
    if (!assistantId) {
      // Create new assistant
      logExternalApi("VAPI", "create_assistant", session.user, {
        agentId: id,
        agentName: agent.agentPersona?.agentName || agent.name,
      });
      try {
        const assistant = await client.assistants.create({
          name: agent.agentPersona?.agentName || agent.name,
          voice: preparedVapiConfig.voice,
          model: preparedVapiConfig.model,
          firstMessage: preparedVapiConfig.firstMessage,
          voicemailMessage: preparedVapiConfig.voicemailMessage,
          endCallMessage: preparedVapiConfig.endCallMessage,
          transcriber: preparedVapiConfig.transcriber,
          serverUrl: process.env.VAPI_WEBHOOK_URL,
          serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET,
        });
        assistantId = assistant.id;
      } catch (error) {
        logExternalApiError("VAPI", "create_assistant", error, session.user, {
          agentId: id,
          agentName: agent.agentPersona?.agentName || agent.name,
        });
        throw error; // Re-throw to be caught by outer try-catch
      }
    } else {
      // Update existing assistant
      logExternalApi("VAPI", "update_assistant", session.user, {
        agentId: id,
        assistantId: assistantId,
        agentName: agent.agentPersona?.agentName || agent.name,
      });

      try {
        const updatedAssistant = await client.assistants.update(assistantId, {
          name: agent.agentPersona?.agentName || agent.name,
          voice: preparedVapiConfig.voice,
          model: preparedVapiConfig.model,
          firstMessage: preparedVapiConfig.firstMessage,
          voicemailMessage: preparedVapiConfig.voicemailMessage,
          endCallMessage: preparedVapiConfig.endCallMessage,
          transcriber: preparedVapiConfig.transcriber,
          serverUrl: process.env.VAPI_WEBHOOK_URL,
          serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET,
        });
      } catch (error) {
        logExternalApiError("VAPI", "update_assistant", error, session.user, {
          agentId: id,
          assistantId: assistantId,
          agentName: agent.agentPersona?.agentName || agent.name,
        });
        throw error; // Re-throw to be caught by outer try-catch
      }
    }

    // Update agent status and phone number
    const updatedAgent = await Agent.findByIdAndUpdate(
      id,
      {
        status: "active",
        assistantId: assistantId,
        $set: {
          "testLaunch.connectedPhoneNumbers": [selectedPhoneNumber._id],
          "testLaunch.isLive": true,
        },
      },
      { new: true }
    );

    logApiSuccess("POST", `/api/agents/${id}/make-live`, 200, session.user, {
      agentId: id,
      assistantId: assistantId,
      phoneNumber: selectedPhoneNumber.phoneNumber,
    });

    return NextResponse.json({
      success: true,
      data: {
        agent: updatedAgent,
        assistantId: assistantId,
        message: "Agent is now live!",
      },
    });
  } catch (error) {
    // Get the id from params for error logging
    const { id } = await params;

    logExternalApiError(
      "VAPI",
      "create_or_update_assistant",
      error,
      session?.user?.email,
      {
        agentId: id,
      }
    );

    logApiError(
      "POST",
      `/api/agents/${id}/make-live`,
      500,
      error,
      session?.user,
      {
        agentId: id,
      }
    );

    return NextResponse.json(
      {
        error: "Failed to make agent live",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
