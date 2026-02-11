import Layout from "@/components/Layout";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";

const monthlyData = [
  { month: "Jan", income: 4200, expense: 2800 },
  { month: "Feb", income: 3800, expense: 3100 },
  { month: "Mar", income: 5100, expense: 2600 },
  { month: "Apr", income: 4600, expense: 3400 },
  { month: "May", income: 4900, expense: 2900 },
  { month: "Jun", income: 5400, expense: 3200 },
];

const categoryData = [
  { name: "Food", value: 850, color: "hsl(8 100% 67%)" },
  { name: "Transport", value: 420, color: "hsl(237 100% 72%)" },
  { name: "Entertainment", value: 320, color: "hsl(258 100% 71%)" },
  { name: "Shopping", value: 580, color: "hsl(40 90% 64%)" },
  { name: "Bills", value: 640, color: "hsl(195 30% 74%)" },
];

const trendData = [
  { month: "Jan", net: 1400 },
  { month: "Feb", net: 700 },
  { month: "Mar", net: 2500 },
  { month: "Apr", net: 1200 },
  { month: "May", net: 2000 },
  { month: "Jun", net: 2200 },
];

const tooltipStyle = {
  backgroundColor: "hsl(228 10% 10%)",
  border: "1px solid hsl(228 8% 18%)",
  borderRadius: "12px",
  color: "#fff",
  fontSize: "12px",
};

const Analytics = () => {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-wider text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Deep dive into your financial data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Income vs Expense */}
          <div className="glass-card card-glow-coral p-6 lg:col-span-2 animate-fade-up">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-4">Income vs Expense</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 8% 14%)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(220 4% 67%)", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(220 4% 67%)", fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="income" fill="hsl(8 100% 67%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" fill="hsl(228 8% 28%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Donut */}
          <div className="glass-card card-glow-blue p-6 animate-fade-up-delay-1">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-4">By Category</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {categoryData.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-xs text-muted-foreground">{c.name}</span>
                  </div>
                  <span className="text-xs font-medium text-foreground">${c.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Net Trend */}
          <div className="glass-card card-glow-purple p-6 lg:col-span-3 animate-fade-up-delay-2">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-4">Monthly Net Savings</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 8% 14%)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(220 4% 67%)", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(220 4% 67%)", fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="net" stroke="hsl(237 100% 72%)" strokeWidth={2.5} dot={{ fill: "hsl(237 100% 72%)", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
