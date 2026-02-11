import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Food & Dining", value: 850, color: "hsl(8 100% 67%)" },
  { name: "Transport", value: 420, color: "hsl(237 100% 72%)" },
  { name: "Entertainment", value: 320, color: "hsl(258 100% 71%)" },
  { name: "Shopping", value: 580, color: "hsl(40 90% 64%)" },
  { name: "Bills", value: 640, color: "hsl(195 30% 74%)" },
  { name: "Other", value: 290, color: "hsl(144 12% 82%)" },
];

const CategoryMapCard = () => {
  return (
    <div className="glass-card card-glow-blue p-6 animate-fade-up-delay-3">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Category Map</p>
        </div>
        <span className="chip">
          <span className="h-1.5 w-1.5 rounded-full bg-soft-blue" />
          This month
        </span>
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
