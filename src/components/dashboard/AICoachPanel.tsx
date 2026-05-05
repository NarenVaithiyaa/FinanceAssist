import { useMemo, useRef, useState, useEffect } from "react";
import { Send, Sparkles, Bot } from "lucide-react";
import { useFinancial } from "@/context/FinancialContext";
import { buildFinancialSnapshot, CoachMessage, requestFinanceCoach } from "@/lib/aiFinance";
import { toast } from "sonner";

const suggestions = [
  "How can I save more?",
  "Analyze my spending",
  "Set a budget goal",
  "Investment tips",
];

const initialMessages: CoachMessage[] = [
  {
    role: "assistant",
    content: "Hey! I'm your AI Finance Coach. Ask me about your budget, expenses, savings, investments, EMIs, or cash flow.",
  },
];

const AICoachPanel = () => {
  const { profile, accounts, transactions, budgets, savingsGoals, emis } = useFinancial();
  const [messages, setMessages] = useState<CoachMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const financialData = useMemo(() => buildFinancialSnapshot({
    profile,
    accounts,
    transactions,
    budgets,
    savingsGoals,
    emis,
  }), [profile, accounts, transactions, budgets, savingsGoals, emis]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  const sendPrompt = async (prompt: string) => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || sending) return;

    const userMessage: CoachMessage = { role: "user", content: trimmedPrompt };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const response = await requestFinanceCoach({
        mode: "chat",
        prompt: trimmedPrompt,
        financialData,
        messages,
      });

      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (error: any) {
      toast.error(error.message || "AI finance coach is unavailable right now.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I could not reach the AI service right now. Please check the Gemini API key and try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass-card card-glow-violet p-6 col-span-1 lg:col-span-2 animate-fade-up-delay-4 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-violet">
          <Bot className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <p className="text-sm font-heading font-semibold text-foreground uppercase tracking-wider">AI Finance Coach</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-violet" /> Gemini powered
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 mb-4 max-h-64 overflow-y-auto pr-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-violet text-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              Thinking through your numbers...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => sendPrompt(suggestion)}
            disabled={sending}
            className="chip hover:bg-muted/80 transition-colors cursor-pointer btn-press text-xs disabled:opacity-60"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendPrompt(input)}
          placeholder="Ask about your finances..."
          disabled={sending}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-60"
        />
        <button
          onClick={() => sendPrompt(input)}
          disabled={sending || !input.trim()}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-violet text-foreground transition-all hover:opacity-90 btn-press disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AICoachPanel;
