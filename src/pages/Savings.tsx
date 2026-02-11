import Layout from "@/components/Layout";
import { LineChart, Line, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Sparkles, Target } from "lucide-react";

const savingsData = [
  { month: "Jan", amount: 800 },
  { month: "Feb", amount: 1200 },
  { month: "Mar", amount: 1050 },
  { month: "Apr", amount: 1800 },
  { month: "May", amount: 2100 },
  { month: "Jun", amount: 2400 },
];

const goals = [
  { name: "Emergency Fund", current: 4200, target: 10000, color: "bg-violet" },
  { name: "Vacation", current: 1800, target: 3000, color: "bg-coral" },
  { name: "New Laptop", current: 1200, target: 2500, color: "bg-purple" },
];

const tips = [
  "Try cutting dining expenses by 10% — that's ~$85/month saved.",
  "Your subscription total is $89/mo. Consider auditing unused ones.",
  "At your current rate, you'll hit your emergency fund goal by October.",
];

const Savings = () => {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-wider text-foreground">Savings</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered insights for your savings goals</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Trend Chart */}
          <div className="glass-card card-glow-violet p-6 animate-fade-up">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Savings Trend</p>
            <h3 className="text-2xl font-heading font-bold text-foreground">$2,400</h3>
            <p className="text-xs text-violet mb-4">This month</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={savingsData}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(220 4% 67%)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(228 10% 10%)", border: "1px solid hsl(228 8% 18%)", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="amount" stroke="hsl(258 100% 71%)" strokeWidth={2.5} dot={{ fill: "hsl(258 100% 71%)", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Goals */}
          <div className="glass-card p-6 animate-fade-up-delay-1">
            <div className="flex items-center gap-2 mb-5">
              <Target className="h-5 w-5 text-violet" />
              <p className="text-sm font-heading font-semibold text-foreground uppercase tracking-wider">Savings Goals</p>
            </div>
            <div className="space-y-5">
              {goals.map((goal) => {
                const pct = Math.round((goal.current / goal.target) * 100);
                return (
                  <div key={goal.name}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-foreground">{goal.name}</span>
                      <span className="text-xs text-muted-foreground">${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${goal.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="glass-card card-glow-violet p-6 lg:col-span-2 animate-fade-up-delay-2">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-violet" />
              <p className="text-sm font-heading font-semibold text-foreground uppercase tracking-wider">AI Recommendations</p>
            </div>
            <div className="space-y-3">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet/20 text-xs font-bold text-violet">
                    {i + 1}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Savings;
