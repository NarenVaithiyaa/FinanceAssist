import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

import { useFinancial } from "@/lib/FinancialContext";

const data = [
  { month: "Jan", income: 4200, expense: 2800 },
  { month: "Feb", income: 3800, expense: 3100 },
  { month: "Mar", income: 5100, expense: 2600 },
  { month: "Apr", income: 4600, expense: 3400 },
  { month: "May", income: 4900, expense: 2900 },
  { month: "Jun", income: 5400, expense: 3200 },
];

const BalanceCard = () => {
  const { accounts } = useFinancial();
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalIncome = data.reduce((s, d) => s + d.income, 0);
  const totalExpense = data.reduce((s, d) => s + d.expense, 0);

  return (
    <div className="glass-card card-glow-coral p-6 col-span-1 lg:col-span-2 animate-fade-up">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Balance</p>
          <h2 className="text-3xl font-heading font-bold mt-1 text-foreground">
            ${totalBalance.toLocaleString()}
          </h2>
        </div>
        <span className="chip">
          <span className="h-1.5 w-1.5 rounded-full bg-coral" />
          Real-time
        </span>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-coral" />
          <span className="text-xs text-muted-foreground">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
          <span className="text-xs text-muted-foreground">Expense</span>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(220 4% 67%)", fontSize: 12 }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(228 10% 10%)",
                border: "1px solid hsl(228 8% 18%)",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="income" fill="hsl(8 100% 67%)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expense" fill="hsl(228 8% 28%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-6 mt-4 pt-4 border-t border-border/30">
        <div>
          <p className="text-xs text-muted-foreground">Total Income</p>
          <p className="text-sm font-semibold text-coral">${totalIncome.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Expense</p>
          <p className="text-sm font-semibold text-foreground">${totalExpense.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
