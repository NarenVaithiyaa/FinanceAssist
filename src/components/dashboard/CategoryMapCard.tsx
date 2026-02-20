import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const expenseData = [
  { name: "Education", value: 320, color: "hsl(237 100% 72%)" },
  { name: "Entertainment", value: 280, color: "hsl(258 100% 71%)" },
  { name: "Food", value: 850, color: "hsl(8 100% 67%)" },
  { name: "Friends", value: 190, color: "hsl(40 90% 64%)" },
  { name: "Health", value: 420, color: "hsl(144 12% 82%)" },
  { name: "Personal", value: 340, color: "hsl(195 30% 74%)" },
  { name: "Others", value: 290, color: "hsl(220 4% 67%)" },
];

const incomeData = [
  { name: "Income", value: 5200, color: "hsl(40 90% 64%)" },
  { name: "Others", value: 720, color: "hsl(195 30% 74%)" },
];

const CategoryMapCard = () => {
  const [mode, setMode] = useState<"expense" | "income">("expense");
  const data = mode === "expense" ? expenseData : incomeData;

  return (
    <div className="glass-card card-glow-blue p-6 animate-fade-up-delay-3">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Category Map</p>
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
