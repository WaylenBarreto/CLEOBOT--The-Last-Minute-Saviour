let aiInstance: any = null;

async function sendJson(res: any, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

async function getRequestBody(req: any) {
  if (req.body) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
}

function parseJsonObjectFromModelText<T>(text: string, context: string): T {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence) as T;
  } catch {
    const firstBrace = withoutFence.indexOf("{");
    const lastBrace = withoutFence.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1)) as T;
      } catch {
        // Fall through to a clearer API error below.
      }
    }

    console.error(`[Gemini SDK] ${context} returned invalid JSON:`, text);
    throw new Error(`${context} returned invalid JSON. Please retry the request.`);
  }
}

async function getGeminiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in Vercel environment variables.");
    }

    const { GoogleGenAI } = await import("@google/genai");
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

async function generateContentWithFallback(
  ai: any,
  contents: any,
  config: any,
  preferredModel = "gemini-3.5-flash"
) {
  const modelsToTry = [preferredModel, "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    let attempts = 2;
    let delay = 750;

    while (attempts > 0) {
      try {
        return await ai.models.generateContent({ model, contents, config });
      } catch (err: any) {
        lastError = err;
        const errStr = String(err.message || err);
        const isRetryable =
          errStr.includes("503") ||
          errStr.includes("429") ||
          errStr.includes("UNAVAILABLE") ||
          errStr.includes("RESOURCE_EXHAUSTED") ||
          errStr.includes("demand") ||
          errStr.includes("temporary");

        if (isRetryable && attempts > 1) {
          attempts--;
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content after attempting all fallback models.");
}

async function handleGmail(req: any, res: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendJson(res, 401, { error: "Missing or invalid authorization token" });
  }

  const token = authHeader.split(" ")[1];
  const listRes = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=5", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!listRes.ok) {
    const errText = await listRes.text();
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
      parsedMessages.push({
        from: headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "(Unknown Sender)",
        subject: headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)",
        snippet: detail.snippet || "",
      });
    }
  }

  const formattedText = parsedMessages.length
    ? parsedMessages.map((m) => `From: ${m.from}\nSubject: ${m.subject}\nBody: ${m.snippet}\n`).join("\n")
    : "No unread messages found in your inbox. Excellent inbox zero state!";

  return sendJson(res, 200, { formattedText, messages: parsedMessages });
}

async function handleCalendar(req: any, res: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendJson(res, 401, { error: "Missing or invalid authorization token" });
  }

  const token = authHeader.split(" ")[1];
  const nowIso = new Date().toISOString();
  const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(nowIso)}&maxResults=8&singleEvents=true&orderBy=startTime`;
  const calRes = await fetch(calendarUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!calRes.ok) {
    const errText = await calRes.text();
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
      const formattedStart = start
        ? new Date(start).toLocaleString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            month: "short",
            day: "numeric",
          })
        : "All Day";
      formattedText += `- ${formattedStart}: ${ev.summary || "Untitled Event"}${ev.description ? ` (${ev.description})` : ""}\n`;
    });
  }

  return sendJson(res, 200, { formattedText, events });
}

async function handleAnalyzeTask(req: any, res: any) {
  const { Type } = await import("@google/genai");
  const { taskInput, dueInfo, clientTime } = await getRequestBody(req);

  if (!taskInput || typeof taskInput !== "string" || taskInput.trim() === "") {
    return sendJson(res, 400, { error: "Task input is required and must be a string." });
  }

  const ai = await getGeminiClient();
  const response = await generateContentWithFallback(
    ai,
    `Analyze the following raw, messy task input and create the structured game plan:\n---\n${taskInput}\n---`,
    {
      systemInstruction: `You are the core intelligence engine of "The Last-Minute Life Saver," an elite agentic AI productivity companion.
Your job is to analyze raw, messy, hurried, or high-level last-minute task inputs and convert them into a hyper-structured, logical, and executable step-by-step game plan.

Analyze the input strictly according to urgency, complexity, and required actions.

Guidelines:
1. Break down massive or ambiguous tasks into chronological, extremely actionable micro-steps.
2. Determine if any autonomous action can be taken by an AI agent.
3. Determine if the urgency warrants triggering Panic Mode.
4. Assign a strict, logical priority level.
5. Suggest a precise escalation strategy if the user ghosts this deadline.

Current Local Time Context: ${clientTime || new Date().toISOString()}
User Specified Due Info: ${dueInfo || "Not specified, evaluate from the messy task text"}`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          taskName: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ["Critical", "High", "Medium", "Low"] },
          estimatedTotalMinutes: { type: Type.INTEGER },
          panicModeTrigger: { type: Type.BOOLEAN },
          actionableSteps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                stepOrder: { type: Type.INTEGER },
                description: { type: Type.STRING },
                estimatedMinutes: { type: Type.INTEGER },
                requiresAgentExecution: { type: Type.BOOLEAN },
                agentExecutionType: { type: Type.STRING, enum: ["email_draft", "web_search", "calendar_block", "none"] },
                agentContext: { type: Type.STRING },
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
          escalationStrategy: { type: Type.STRING },
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
    }
  );

  if (!response.text) {
    throw new Error("Received empty response from Gemini.");
  }

  return sendJson(res, 200, parseJsonObjectFromModelText(response.text, "Gemini task planner"));
}

async function handleExecuteStep(req: any, res: any) {
  const { agentExecutionType, agentContext, stepDescription, taskName } = await getRequestBody(req);

  if (!agentExecutionType || !agentContext) {
    return sendJson(res, 400, { error: "agentExecutionType and agentContext are required." });
  }

  let systemInstruction = "";
  if (agentExecutionType === "email_draft") {
    systemInstruction = "Generate a polished professional email draft with a clear Subject line and Body.";
  } else if (agentExecutionType === "web_search") {
    systemInstruction = "Provide a practical, structured research brief with actionable steps and useful links if known.";
  } else if (agentExecutionType === "calendar_block") {
    systemInstruction = "Generate a structured time-blocking schedule with title, duration, description, and preparation checklist.";
  } else {
    return sendJson(res, 400, { error: "Invalid agent execution type." });
  }

  const ai = await getGeminiClient();
  const response = await generateContentWithFallback(
    ai,
    `Task Name: ${taskName || "General Task"}\nStep to execute: ${stepDescription || "Assist with task"}\nInstructions & Context: ${agentContext}`,
    { systemInstruction }
  );

  return sendJson(res, 200, { output: response.text });
}

async function handleGuardianAnalyze(req: any, res: any) {
  const { Type } = await import("@google/genai");
  const { streamInput, clientTime } = await getRequestBody(req);

  if (!streamInput || typeof streamInput !== "string" || streamInput.trim() === "") {
    return sendJson(res, 400, { error: "Background stream data input is required." });
  }

  const ai = await getGeminiClient();
  const response = await generateContentWithFallback(
    ai,
    `Analyze this background stream input:\n---\n${streamInput}\n---`,
    {
      systemInstruction: `You are the Autonomous Guardian Engine for "The Last-Minute Life Saver."
Analyze emails, calendar schedules, or task lists to discover missed commitments, time conflicts, and defensive schedules.
Current Local Time Context: ${clientTime || new Date().toISOString()}
Respond exclusively with valid JSON.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          modeDetected: { type: Type.STRING, enum: ["HARVEST", "BLOCK_BUFFER", "ESCALATE"] },
          discoveredDeadlines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                sourceContext: { type: Type.STRING },
                urgencyScore: { type: Type.STRING, enum: ["Critical", "High", "Medium", "Low"] },
                targetDeadlineTime: { type: Type.STRING },
              },
              required: ["title", "sourceContext", "urgencyScore", "targetDeadlineTime"],
            },
          },
          proposedFocusBlocks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                recommendedDurationMinutes: { type: Type.INTEGER },
                urgencyAlignment: { type: Type.STRING },
              },
              required: ["summary", "recommendedDurationMinutes", "urgencyAlignment"],
            },
          },
          panicModeTrigger: { type: Type.BOOLEAN },
          escalationTwiMLScript: { type: Type.STRING },
        },
        required: [
          "modeDetected",
          "discoveredDeadlines",
          "proposedFocusBlocks",
          "panicModeTrigger",
          "escalationTwiMLScript",
        ],
      },
    }
  );

  if (!response.text) {
    throw new Error("Received empty response from Gemini Guardian Engine.");
  }

  return sendJson(res, 200, parseJsonObjectFromModelText(response.text, "Gemini Guardian Engine"));
}

export default async function handler(req: any, res: any) {
  const pathname = new URL(req.url || "/api", "https://cleobot.local").pathname;

  try {
    if (pathname === "/api" || pathname === "/api/health") {
      return sendJson(res, 200, {
        ok: true,
        entrypoint: "api/index.ts",
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
        runtime: process.env.VERCEL ? "vercel" : "node",
      });
    }

    if (req.method === "GET" && pathname === "/api/google/gmail") {
      return handleGmail(req, res);
    }

    if (req.method === "GET" && pathname === "/api/google/calendar") {
      return handleCalendar(req, res);
    }

    if (req.method === "POST" && pathname === "/api/analyze-task") {
      return handleAnalyzeTask(req, res);
    }

    if (req.method === "POST" && pathname === "/api/execute-step") {
      return handleExecuteStep(req, res);
    }

    if (req.method === "POST" && pathname === "/api/guardian-analyze") {
      return handleGuardianAnalyze(req, res);
    }

    return sendJson(res, 404, { error: `API route not found: ${pathname}` });
  } catch (error: any) {
    console.error(`Error in ${pathname}:`, error);
    return sendJson(res, 500, { error: error.message || "A server error has occurred." });
  }
}
