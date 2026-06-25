import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

function parseJsonObjectFromModelText<T>(text: string, context: string): T {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence) as T;
  } catch (initialError) {
    const firstBrace = withoutFence.indexOf("{");
    const lastBrace = withoutFence.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const jsonSlice = withoutFence.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(jsonSlice) as T;
      } catch {
        // Fall through to the clearer context-specific error below.
      }
    }

    console.error(`[Gemini SDK] ${context} returned invalid JSON:`, text);
    throw new Error(`${context} returned invalid JSON. Please retry the request.`);
  }
}

// Lazy-loaded Gemini Client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please configure it in Settings > Secrets in the AI Studio UI.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

/**
 * Executes a generateContent call with automatic retries and model fallbacks.
 * This ensures high availability and resilience against transient 503, 429, or capacity errors.
 */
async function generateContentWithFallback(
  ai: GoogleGenAI,
  contents: any,
  config: any,
  preferredModel: string = "gemini-3.5-flash"
): Promise<any> {
  const modelsToTry = [
    preferredModel,
    "gemini-flash-latest",
    "gemini-3.1-flash-lite"
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    let attempts = 3;
    let delay = 1000; // start with 1 second delay

    while (attempts > 0) {
      try {
        console.log(`[Gemini SDK] Attempting generation with model: ${model} (${attempts} attempts remaining)`);
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errStr = String(err.message || err);
        console.warn(`[Gemini SDK] Warning: Error with model ${model}:`, errStr);

        // Check for common retryable transient errors (503 Service Unavailable, 429 Rate Limit, network spikes, etc.)
        const isRetryable = 
          errStr.includes("503") || 
          errStr.includes("429") || 
          errStr.includes("UNAVAILABLE") || 
          errStr.includes("RESOURCE_EXHAUSTED") || 
          errStr.includes("demand") || 
          errStr.includes("temporary");

        if (isRetryable && attempts > 1) {
          attempts--;
          console.log(`[Gemini SDK] Transient error encountered. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
        } else {
          // If not retryable or we've run out of attempts, try the next fallback model in the list
          console.log(`[Gemini SDK] Failed with model ${model}. Moving to fallback model if available.`);
          break;
        }
      }
    }
  }

  // If we exhausted all fallback models and retries, throw the last error
  throw lastError || new Error("Failed to generate content after attempting all fallback models.");
}

// Google Gmail API Proxy for unread messages
app.get("/api/google/gmail", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization token" });
    }
    const token = authHeader.split(" ")[1];

    // List top 5 unread messages
    const listUrl = "https://www.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=5";
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!listRes.ok) {
      const errText = await listRes.text();
      console.error(`Gmail API Error: ${listRes.statusText} - Details:`, errText);
      throw new Error(`Gmail API list failed: ${listRes.statusText}. Details: ${errText}`);
    }
    const listData: any = await listRes.json();
    const messages = listData.messages || [];

    const parsedMessages = [];
    for (const msg of messages) {
      const detailRes = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (detailRes.ok) {
        const detail: any = await detailRes.json();
        const headers = detail.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
        const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "(Unknown Sender)";
        const bodySnippet = detail.snippet || "";
        parsedMessages.push({
          from,
          subject,
          snippet: bodySnippet,
        });
      }
    }

    let formattedText = "";
    if (parsedMessages.length === 0) {
      formattedText = "No unread messages found in your inbox. Excellent inbox zero state!";
    } else {
      parsedMessages.forEach((m) => {
        formattedText += `From: ${m.from}\nSubject: ${m.subject}\nBody: ${m.snippet}\n\n`;
      });
    }

    res.json({ formattedText, messages: parsedMessages });
  } catch (error: any) {
    console.error("Error in /api/google/gmail:", error);
    res.status(500).json({ error: error.message || "Failed to fetch Gmail data." });
  }
});

// Google Calendar API Proxy for upcoming calendar events
app.get("/api/google/calendar", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization token" });
    }
    const token = authHeader.split(" ")[1];

    const nowIso = new Date().toISOString();
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(nowIso)}&maxResults=8&singleEvents=true&orderBy=startTime`;
    const calRes = await fetch(calendarUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!calRes.ok) {
      const errText = await calRes.text();
      console.error(`Calendar API Error: ${calRes.statusText} - Details:`, errText);
      throw new Error(`Calendar API list failed: ${calRes.statusText}. Details: ${errText}`);
    }
    const calData: any = await calRes.json();
    const events = calData.items || [];

    let formattedText = "My Calendar Events for today and upcoming:\n";
    if (events.length === 0) {
      formattedText += "- No upcoming events found.";
    } else {
      events.forEach((ev: any) => {
        const start = ev.start?.dateTime || ev.start?.date || "";
        const formattedStart = start ? new Date(start).toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          month: "short",
          day: "numeric",
        }) : "All Day";
        formattedText += `- ${formattedStart}: ${ev.summary || "Untitled Event"}${ev.description ? ` (${ev.description})` : ""}\n`;
      });
    }

    res.json({ formattedText, events });
  } catch (error: any) {
    console.error("Error in /api/google/calendar:", error);
    res.status(500).json({ error: error.message || "Failed to fetch Calendar data." });
  }
});

// 1. Analyze Task API endpoint
app.post("/api/analyze-task", async (req, res) => {
  try {
    const { taskInput, dueInfo, clientTime } = req.body;

    if (!taskInput || typeof taskInput !== "string" || taskInput.trim() === "") {
      res.status(400).json({ error: "Task input is required and must be a string." });
      return;
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are the core intelligence engine of "The Last-Minute Life Saver," an elite agentic AI productivity companion.
Your job is to analyze raw, messy, hurried, or high-level last-minute task inputs and convert them into a hyper-structured, logical, and executable step-by-step game plan.

Analyze the input strictly according to:
- Urgency (deadline proximity and time remaining)
- Complexity (number of distinct elements and depth of details)
- Required actions (both human and autonomous agent)

Guidelines:
1. Break down massive or ambiguous tasks into chronological, extremely actionable micro-steps.
2. Determine if any autonomous action can be taken by an AI agent (e.g. generating emails/drafts, web search queries, creating calendar block details).
3. Determine if the urgency warrants triggering "Panic Mode" (due within an extremely short window, e.g. today, tonight, within 24 hours, or highly critical/impactful).
4. Assign a strict, logical priority level (Critical, High, Medium, Low).
5. Suggest a precise, automated, and slightly humorous or highly direct escalation strategy (reminder mechanism) if the user ghosts this deadline.

Use the provided current local time context to calculate due windows:
- Current Local Time Context: ${clientTime || new Date().toISOString()}
- User Specified Due Info: ${dueInfo || "Not specified, evaluate from the messy task text"}
`;

    const userPrompt = `Analyze the following raw, messy task input and create the structured game plan:
---
${taskInput}
---`;

    const response = await generateContentWithFallback(
      ai,
      userPrompt,
      {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            taskName: {
              type: Type.STRING,
              description: "Cleaned up concise version of the main task",
            },
            priority: {
              type: Type.STRING,
              enum: ["Critical", "High", "Medium", "Low"],
              description: "Strict priority level based on deadline proximity and complexity",
            },
            estimatedTotalMinutes: {
              type: Type.INTEGER,
              description: "Estimated total duration of all actionable steps in minutes",
            },
            panicModeTrigger: {
              type: Type.BOOLEAN,
              description: "True if task is highly critical or due within an extremely tight window (e.g. within 24 hours), false otherwise",
            },
            actionableSteps: {
              type: Type.ARRAY,
              description: "Chronological, actionable micro-steps",
              items: {
                type: Type.OBJECT,
                properties: {
                  stepOrder: {
                    type: Type.INTEGER,
                    description: "Chronological order index starting from 1",
                  },
                  description: {
                    type: Type.STRING,
                    description: "Clear, concise, actionable micro-step",
                  },
                  estimatedMinutes: {
                    type: Type.INTEGER,
                    description: "Estimated time to complete this step in minutes",
                  },
                  requiresAgentExecution: {
                    type: Type.BOOLEAN,
                    description: "True if an AI agent can execute/assist with this step (e.g. drafting, search, calendar schedules)",
                  },
                  agentExecutionType: {
                    type: Type.STRING,
                    enum: ["email_draft", "web_search", "calendar_block", "none"],
                    description: "The specific action category suitable for an autonomous agent",
                  },
                  agentContext: {
                    type: Type.STRING,
                    description: "Highly detailed prompt or context instructing the agent how to complete this step (e.g. email recipient, specific search goals, calendar details)",
                  },
                },
                required: [
                  "stepOrder",
                  "description",
                  "estimatedMinutes",
                  "requiresAgentExecution",
                  "agentExecutionType",
                  "agentContext",
                ],
              },
            },
            escalationStrategy: {
              type: Type.STRING,
              description: "A precise reminder escalation plan if the user ghosts this deadline (e.g., 'Bombard user with calendar alarms every 15 minutes starting 2 hours before')",
            },
          },
          required: [
            "taskName",
            "priority",
            "estimatedTotalMinutes",
            "panicModeTrigger",
            "actionableSteps",
            "escalationStrategy",
          ],
        },
      },
      "gemini-3.5-flash"
    );

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Received empty response from Gemini.");
    }

    res.json(parseJsonObjectFromModelText(resultText, "Gemini task planner"));
  } catch (error: any) {
    console.error("Error in /api/analyze-task:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred." });
  }
});

// 2. Execute Agent Step API endpoint
app.post("/api/execute-step", async (req, res) => {
  try {
    const { agentExecutionType, agentContext, stepDescription, taskName } = req.body;

    if (!agentExecutionType || !agentContext) {
      res.status(400).json({ error: "agentExecutionType and agentContext are required." });
      return;
    }

    const ai = getGeminiClient();

    let systemInstruction = "";
    let userPrompt = "";

    if (agentExecutionType === "email_draft") {
      systemInstruction = `You are the email automation module of "The Last-Minute Life Saver".
Generate a highly polished, professional, and context-appropriate email draft. 
Ensure it has a clear Subject line and Body. Include placeholders like [Your Name] where appropriate.
Adopt a highly structured, clear tone that saves the user time.`;
      userPrompt = `Task Name: ${taskName || "General Task"}
Step to execute: ${stepDescription || "Draft an email"}
Instructions & Context: ${agentContext}`;
    } else if (agentExecutionType === "web_search") {
      systemInstruction = `You are the research and synthesis agent of "The Last-Minute Life Saver".
Use your knowledge to research the specified topic, outline steps, gather template designs, or write a curated checklist.
Provide real, actionable answers, outlines, links (if relevant/known), or structured instructions.
Do not provide generic placeholders. Make it look like a highly capable assistant prepared this brief.`;
      userPrompt = `Task Name: ${taskName || "General Task"}
Goal: ${stepDescription || "Gather information"}
Context for Research: ${agentContext}`;
    } else if (agentExecutionType === "calendar_block") {
      systemInstruction = `You are the calendar block strategist of "The Last-Minute Life Saver".
Generate a structured time-blocking schedule for this task. Include a suggested Title, Duration, Description, and preparation checklist.
Structure your answer in a beautiful markdown format. Provide a precise window recommendation.`;
      userPrompt = `Task Name: ${taskName || "General Task"}
Target Action Block: ${stepDescription || "Schedule block"}
Context: ${agentContext}`;
    } else {
      res.status(400).json({ error: "Invalid agent execution type." });
      return;
    }

    const response = await generateContentWithFallback(
      ai,
      userPrompt,
      {
        systemInstruction,
      },
      "gemini-3.5-flash"
    );

    res.json({ output: response.text });
  } catch (error: any) {
    console.error("Error in /api/execute-step:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred." });
  }
});

// 3. Autonomous Guardian Engine API endpoint
app.post("/api/guardian-analyze", async (req, res) => {
  try {
    const { streamInput, clientTime } = req.body;

    if (!streamInput || typeof streamInput !== "string" || streamInput.trim() === "") {
      res.status(400).json({ error: "Background stream data input is required." });
      return;
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are the Autonomous Guardian Engine for "The Last-Minute Life Saver," an elite proactive intelligence agent.
Your core job is to act proactively by analyzing background data streams (like unread emails, calendar schedules, or task lists) to discover missed commitments, flag critical time conflicts, and plan defensive schedules.

Determine the operational mode based on the user's input:
1. MODE A: HARVEST (Gmail Input Analysis)
When provided with a raw collection of unread emails or message snippets, scan them for hidden, implicit, or explicit commitments.
- Identify dates, deadlines, subscription expirations, payment terms, or urgent meeting requests.
- Formulate an immediate, actionable micro-step schedule to preemptively resolve them.

2. MODE B: BLOCK & BUFFER (Calendar Layout Optimization)
When evaluating a newly discovered deadline alongside a user's existing Google Calendar schedule:
- Locate empty blocks of free time prior to the deadline.
- Allocate structured "Focus Blocks" based on the estimated complexity of the task.
- Ensure high-priority tasks claim immediate next-available free slots.

3. MODE C: ESCALATE (Panic Mode Evaluation)
If an upcoming critical deadline is closer than 60 minutes and corresponding checkpoint tasks remain uncompleted:
- Flag the system state as "panic_mode_trigger: true".
- Outline an aggressive external communication backup (e.g., triggering a high-priority automated voice call or draft a protective delay-notice email template).

Current Local Time Context: ${clientTime || new Date().toISOString()}

OUTPUT FORMAT:
You must respond exclusively with a valid JSON object matching this schema. Do not output markdown code blocks or wrapper backticks.`;

    const response = await generateContentWithFallback(
      ai,
      `Analyze this background stream input:
---
${streamInput}
---`,
      {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            modeDetected: {
              type: Type.STRING,
              enum: ["HARVEST", "BLOCK_BUFFER", "ESCALATE"],
              description: "The detected core operational mode representing the primary action required.",
            },
            discoveredDeadlines: {
              type: Type.ARRAY,
              description: "List of missed commitments or upcoming deadlines discovered in the stream",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Clean concise task title descriptive of the issue" },
                  sourceContext: { type: Type.STRING, description: "Brief excerpt from the email or event context explaining why this was flagged" },
                  urgencyScore: { type: Type.STRING, enum: ["Critical", "High", "Medium", "Low"] },
                  targetDeadlineTime: { type: Type.STRING, description: "ISO timestamp string if available, or relative description" },
                },
                required: ["title", "sourceContext", "urgencyScore", "targetDeadlineTime"],
              },
            },
            proposedFocusBlocks: {
              type: Type.ARRAY,
              description: "Structured focus blocks planned in empty times to solve the discovered deadlines",
              items: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING, description: "Focus Time: Specific action objective" },
                  recommendedDurationMinutes: { type: Type.INTEGER },
                  urgencyAlignment: { type: Type.STRING, description: "Why this block is scheduled at this priority" },
                },
                required: ["summary", "recommendedDurationMinutes", "urgencyAlignment"],
              },
            },
            panicModeTrigger: {
              type: Type.BOOLEAN,
              description: "True if any upcoming critical deadline is closer than 60 minutes and corresponding checkpoint tasks remain uncompleted, false otherwise.",
            },
            escalationTwiMLScript: {
              type: Type.STRING,
              description: "A sharp, highly energetic script text for a voice call to get the user moving immediately, if panic mode is true.",
            },
          },
          required: [
            "modeDetected",
            "discoveredDeadlines",
            "proposedFocusBlocks",
            "panicModeTrigger",
            "escalationTwiMLScript",
          ],
        },
      },
      "gemini-3.5-flash"
    );

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Received empty response from Gemini Guardian Engine.");
    }

    res.json(parseJsonObjectFromModelText(resultText, "Gemini Guardian Engine"));
  } catch (error: any) {
    console.error("Error in /api/guardian-analyze:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred." });
  }
});

// Serve Vite in development, static in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
