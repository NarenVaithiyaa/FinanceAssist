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

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    return sendJson(res, 500, { error: "Gemini API key is not configured." });
  }

  try {
    const body = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) as RequestBody | undefined;
    const mode = body?.mode === "savings-suggestions" ? "savings-suggestions" : "chat";
    const prompt = String(body?.prompt || "").trim();
    const messages = Array.isArray(body?.messages) ? body.messages.slice(-8) : [];
    const financialData = body?.financialData;

    if (!financialData) {
      return sendJson(res, 400, { error: "Financial data is required." });
    }

    if (mode === "chat" && !prompt) {
      return sendJson(res, 400, { error: "Prompt is required." });
    }

    const contents = [
      ...messages
        .filter(isCoachMessage)
        .map((message) => ({
          role: toGeminiRole(message.role),
          parts: [{ text: String(message.content).slice(0, 2000) }],
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
          maxOutputTokens: mode === "savings-suggestions" ? 450 : 900,
        },
      }),
    });

    const geminiBody = await geminiResponse.json() as GeminiResponseBody;

    if (!geminiResponse.ok) {
      return sendJson(res, geminiResponse.status, {
        error: geminiBody?.error?.message || "Gemini request failed.",
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
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : "AI finance coach failed.",
    });
  }
}
