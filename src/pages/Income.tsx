import Layout from "@/components/Layout";
import { TrendingUp, Briefcase, Gift, Landmark, ArrowUpRight } from "lucide-react";

const incomes = [
  { id: 1, title: "Salary", source: "Company Inc.", amount: 4500, date: "1st Feb", icon: Briefcase, growth: "+3.2%" },
  { id: 2, title: "Freelance Project", source: "Client A", amount: 1200, date: "5th Feb", icon: Landmark, growth: "+15%" },
  { id: 3, title: "Dividends", source: "Investment", amount: 340, date: "10th Feb", icon: TrendingUp, growth: "+2.1%" },
  { id: 4, title: "Gift", source: "Family", amount: 200, date: "14th Feb", icon: Gift, growth: null },
  { id: 5, title: "Side Project", source: "App Revenue", amount: 680, date: "18th Feb", icon: Landmark, growth: "+28%" },
];

const Income = () => {
  const total = incomes.reduce((s, i) => s + i.amount, 0);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-wider text-foreground">Income</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your earnings and revenue streams</p>
        </div>

        <div className="glass-card card-glow-yellow p-6 mb-6 animate-fade-up">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">Total Income This Month</p>
          <h2 className="text-3xl font-heading font-bold mt-1 text-foreground">${total.toLocaleString()}</h2>
          <p className="text-xs text-yellow mt-2 flex items-center gap-1">
            <ArrowUpRight className="h-3.5 w-3.5" /> +8.4% from last month
          </p>
        </div>

        <div className="space-y-3">
          {incomes.map((inc, i) => (
            <div
              key={inc.id}
              className="glass-card p-4 flex items-center gap-4 animate-fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow/20">
                <inc.icon className="h-5 w-5 text-yellow" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{inc.title}</p>
                <p className="text-xs text-muted-foreground">{inc.source} · {inc.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">+${inc.amount.toLocaleString()}</p>
                {inc.growth && (
                  <span className="inline-flex items-center rounded-full bg-yellow/10 px-2 py-0.5 text-[10px] font-medium text-yellow">
                    {inc.growth}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Income;
