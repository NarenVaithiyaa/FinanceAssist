import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useFinancial } from "@/context/FinancialContext";
import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isWithinInterval, parseISO } from "date-fns";

const BalanceCard = () => {
  const { accounts, transactions } = useFinancial();
  
  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts]);

  const chartData = useMemo(() => {
    // Get last 6 months
    const last6Months = eachMonthOfInterval({
      start: startOfMonth(subMonths(new Date(), 5)),
      end: endOfMonth(new Date()),
    });

    return last6Months.map(monthDate => {
      const monthLabel = format(monthDate, "MMM");
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthTransactions = transactions.filter(t => {
        const tDate = parseISO(t.date);
        return isWithinInterval(tDate, { start: monthStart, end: monthEnd });
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: monthLabel,
        income,
        expense
      };
    });
  }, [transactions]);

  const totalIncome = useMemo(() => chartData.reduce((s, d) => s + d.income, 0), [chartData]);
  const totalExpense = useMemo(() => chartData.reduce((s, d) => s + d.expense, 0), [chartData]);

  return (
    <div className="glass-card card-glow-coral p-6 col-span-1 lg:col-span-2 animate-fade-up h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Balance</p>
          <h2 className="text-3xl font-heading font-bold mt-1 text-foreground">
            ₹{totalBalance.toLocaleString()}
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
          <BarChart data={chartData} barGap={4}>
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
          <p className="text-xs text-muted-foreground">Period Income</p>
          <p className="text-sm font-semibold text-coral">₹{totalIncome.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Period Expense</p>
          <p className="text-sm font-semibold text-foreground">₹{totalExpense.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
