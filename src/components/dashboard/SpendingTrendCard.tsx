import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { day: "Mon", amount: 120 },
  { day: "Tue", amount: 280 },
  { day: "Wed", amount: 190 },
  { day: "Thu", amount: 340 },
  { day: "Fri", amount: 250 },
  { day: "Sat", amount: 420 },
  { day: "Sun", amount: 180 },
];

const SpendingTrendCard = () => {
  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="glass-card card-glow-purple p-6 animate-fade-up-delay-1">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Spending Trend</p>
          <h3 className="text-2xl font-heading font-bold mt-1 text-foreground">${total.toLocaleString()}</h3>
        </div>
        <span className="chip">
          <span className="h-1.5 w-1.5 rounded-full bg-purple" />
          This week
        </span>
      </div>

      <div className="h-36 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 10, right: 10 }}>
            <defs>
              <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(237 100% 72%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(237 100% 72%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(220 4% 67%)", fontSize: 11 }}
              interval={0}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(228 10% 10%)",
                border: "1px solid hsl(228 8% 18%)",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="hsl(237 100% 72%)"
              strokeWidth={2.5}
              fill="url(#purpleGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        <span className="text-purple font-medium">+12%</span> vs last week
      </p>
    </div>
  );
};

export default SpendingTrendCard;
