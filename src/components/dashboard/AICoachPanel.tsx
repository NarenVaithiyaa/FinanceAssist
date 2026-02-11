import { useState } from "react";
import { Send, Sparkles, Bot } from "lucide-react";

const suggestions = [
  "How can I save more?",
  "Analyze my spending",
  "Set a budget goal",
  "Investment tips",
];

type Message = { role: "user" | "assistant"; content: string };

const initialMessages: Message[] = [
  {
    role: "assistant",
    content: "Hey! I'm your AI Finance Coach 🤖 I can help you track spending, set goals, and optimize your finances. What would you like to know?",
  },
];

const AICoachPanel = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user" as const, content: input },
      {
        role: "assistant" as const,
        content: "That's a great question! Based on your spending patterns, I'd suggest reviewing your dining expenses — they're up 15% this month. Want me to create a budget plan?",
      },
    ]);
    setInput("");
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
            <Sparkles className="h-3 w-3 text-violet" /> Powered by AI
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 mb-4 max-h-48 overflow-y-auto pr-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-violet text-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => setInput(s)}
            className="chip hover:bg-muted/80 transition-colors cursor-pointer btn-press text-xs"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask your finance coach..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
        <button
          onClick={handleSend}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-violet text-foreground transition-all hover:opacity-90 btn-press"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AICoachPanel;
