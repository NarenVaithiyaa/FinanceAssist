import { createClient } from "@supabase/supabase-js";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

const systemInstruction = `You are PennyWise AI Finance Coach.
Use only the user's provided financial snapshot and chat history.
Be practical, specific, concise, and kind.
Never invent balances, transactions, goals, budgets, EMIs, income, or expenses.
If data is missing, say what is missing and suggest the next useful action.
Do not provide guaranteed investment returns, legal advice, or tax advice.
Use Indian Rupees when discussing money.`;

type CoachMessage = {
  role: "user" | "assistant";
  content: string;
};

type ApiRequest = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
};

type RequestBody = {
  mode?: "chat" | "savings-suggestions";
  prompt?: string;
  messages?: unknown[];
  financialData?: unknown;
};

type GeminiErrorBody = {
  error?: {
    message?: string;
  };
};

type GeminiResponseBody = GeminiErrorBody & {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

const sendJson = (res: ApiResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

const toGeminiRole = (role: CoachMessage["role"]) => role === "assistant" ? "model" : "user";

const isCoachMessage = (message: unknown): message is CoachMessage => {
  if (!message || typeof message !== "object") return false;
  const candidate = message as Partial<CoachMessage>;
  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    candidate.content.trim().length > 0
  );
};

const buildPrompt = (mode: string, prompt: string, financialData: unknown) => {
  if (mode === "savings-suggestions") {
    return `Create today's smart savings suggestions for this user.
Return 3 concise, actionable suggestions, each on its own line.
Tie each suggestion to the user's actual savings, budget, income, expense, investment, EMI, or account data.
If the user has no useful data yet, return onboarding suggestions without fake numbers.

Financial snapshot JSON:
${JSON.stringify(financialData)}`;
  }

  return `User question:
${prompt}

Financial snapshot JSON:
${JSON.stringify(financialData)}`;
};

// In-memory rate limiting (simple IP/token based could go here, but keeping it simple with global cap)
let recentRequests = 0;
setInterval(() => { recentRequests = Math.max(0, recentRequests - 10); }, 60000); // 10 req/min cooldown reduction

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  // Lightweight DDOS/Spam protection
  recentRequests++;
  if (recentRequests > 50) {
    return sendJson(res, 429, { error: "Too many requests. Please try again later." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    console.error("API configuration is missing.");
    return sendJson(res, 500, { error: "Server configuration error." });
  }

  // JWT Verification
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  const token = typeof authHeader === "string" ? authHeader.replace("Bearer ", "").trim() : "";
  const authHeaderArray = Array.isArray(authHeader) ? authHeader[0] : token;
  const finalToken = typeof authHeaderArray === "string" ? authHeaderArray.replace("Bearer ", "").trim() : "";

  if (!finalToken) {
    return sendJson(res, 401, { error: "Unauthorized: Missing authentication token." });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(finalToken);

  if (authError || !user) {
    console.error("Supabase Auth Error:", authError?.message);
    return sendJson(res, 401, { error: "Unauthorized: Invalid token." });
  }

  try {
    let body: RequestBody | undefined;
    try {
      body = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) as RequestBody | undefined;
    } catch (e) {
      return sendJson(res, 400, { error: "Invalid JSON body." });
    }
    
    const mode = body?.mode === "savings-suggestions" ? "savings-suggestions" : "chat";
    const prompt = String(body?.prompt || "").trim();
    const messages = Array.isArray(body?.messages) ? body.messages.slice(-8) : [];
    const financialData = body?.financialData;

    if (!financialData) {
      return sendJson(res, 400, { error: "Financial data is required." });
    }

    // Safety checks for abuse prevention
    const financialDataString = JSON.stringify(financialData);
    if (financialDataString.length > 50000) { // Limit payload size (~50KB)
      return sendJson(res, 413, { error: "Financial data is too large." });
    }

    if (mode === "chat") {
      if (!prompt) {
        return sendJson(res, 400, { error: "Prompt is required." });
      }
      if (prompt.length > 1000) { // Cap prompt length
        return sendJson(res, 413, { error: "Prompt exceeds 1000 characters." });
      }
    }

    const contents = [
      ...messages
        .filter(isCoachMessage)
        .map((message) => ({
          role: toGeminiRole(message.role),
          parts: [{ text: String(message.content).slice(0, 1000) }], // Limit history text size
        })),
      {
        role: "user",
        parts: [{ text: buildPrompt(mode, prompt, financialData) }],
      },
    ];

    const geminiResponse = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents,
        generationConfig: {
          temperature: mode === "savings-suggestions" ? 0.35 : 0.45,
          topP: 0.9,
          maxOutputTokens: mode === "savings-suggestions" ? 450 : 800, // Capped output tokens
        },
      }),
    });

    const geminiBody = await geminiResponse.json() as GeminiResponseBody;

    if (!geminiResponse.ok) {
      console.error("Gemini API Error:", geminiBody);
      return sendJson(res, geminiResponse.status, {
        error: "AI service failed to process request.",
      });
    }

    const text = geminiBody.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    return sendJson(res, 200, {
      text: text || "I could not generate a response from the provided financial data.",
    });
  } catch (error: unknown) {
    console.error("Internal API Error:", error);
    return sendJson(res, 500, {
      error: "AI finance coach experienced an internal error.",
    });
  }
}
