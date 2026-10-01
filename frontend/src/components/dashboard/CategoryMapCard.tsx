import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useFinancial } from "@/context/FinancialContext";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

const CATEGORY_COLORS: Record<string, string> = {
  Education: "hsl(237 100% 72%)",
  Entertainment: "hsl(258 100% 71%)",
  Food: "hsl(8 100% 67%)",
  Friends: "hsl(40 90% 64%)",
  Health: "hsl(144 12% 82%)",
  Investment: "hsl(8 100% 67%)",
  Personal: "hsl(195 30% 74%)",
  Others: "hsl(220 4% 67%)",
  Income: "hsl(40 90% 64%)",
};

const CategoryMapCard = () => {
  const { transactions } = useFinancial();
  const [mode, setMode] = useState<"expense" | "income">("expense");

  const data = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthTransactions = transactions.filter(t => {
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, { start: monthStart, end: monthEnd }) && t.type === mode;
    });

    const categories: Record<string, number> = {};
    monthTransactions.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS.Others
    }));
  }, [transactions, mode]);

  return (
    <div className="glass-card card-glow-blue p-6 animate-fade-up-delay-3 h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Category Map</p>
          <p className="text-[10px] text-muted-foreground uppercase">This Month</p>
        </div>
        <div className="flex rounded-full bg-muted p-0.5">
          <button
            onClick={() => setMode("expense")}
            className={`px-3 py-1 text-[11px] font-medium rounded-full transition-colors ${
              mode === "expense"
                ? "bg-coral text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Expense
          </button>
          <button
            onClick={() => setMode("income")}
            className={`px-3 py-1 text-[11px] font-medium rounded-full transition-colors ${
              mode === "income"
                ? "bg-yellow text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Income
          </button>
        </div>
      </div>

      <div className="h-40 flex items-center justify-center">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(228 10% 10%)",
                  border: "1px solid hsl(228 8% 18%)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground">No data for this month</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[11px] text-muted-foreground truncate">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryMapCard;
