import { useFinancial } from "@/context/FinancialContext";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, format } from "date-fns";

const normalizeInvestmentName = (value: string) => value.trim().toLowerCase();

const BudgetProgressCard = () => {
  const { transactions, accounts, budgets, savingsGoals } = useFinancial();

  const data = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const currentMonth = format(now, "yyyy-MM");

    const monthTransactions = transactions.filter(t => {
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, { start: monthStart, end: monthEnd });
    });

    const monthlyExpense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
    
    const monthlyBudgetTarget = budgets.find(b => b.month === currentMonth && b.category === "Total")?.limit_amount || 5000;
    
    // Sum total target amounts of all saving goals currently active
    const totalSavingsGoalTarget = savingsGoals.filter(g => g.category !== 'investment').reduce((s, g) => s + Number(g.target_amount), 0) || 10000;
    const totalSavingsGoalCurrent = savingsGoals.filter(g => g.category !== 'investment').reduce((s, g) => s + Number(g.current_amount), 0) || totalBalance;

    const investmentNames = new Set(
      savingsGoals
        .filter(g => g.category === 'investment')
        .map(g => normalizeInvestmentName(g.name))
    );

    const matchedInvestmentExpenseTotal = transactions
      .filter(t => (
        t.type === 'expense' &&
        t.category === 'Investment' &&
        investmentNames.has(normalizeInvestmentName(t.description || ""))
      ))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalInvestmentTarget = savingsGoals.filter(g => g.category === 'investment').reduce((s, g) => s + Number(g.target_amount), 0) || 1000;
    const totalInvestmentCurrent = savingsGoals.filter(g => g.category === 'investment').reduce((s, g) => s + Number(g.current_amount), 0) + matchedInvestmentExpenseTotal;

    return [
      { label: "Monthly Budget", current: monthlyExpense, target: monthlyBudgetTarget, color: "bg-mint" },
      { label: "Savings Goal", current: totalSavingsGoalCurrent, target: totalSavingsGoalTarget, color: "bg-violet" },
      { label: "Investment", current: totalInvestmentCurrent, target: totalInvestmentTarget, color: "bg-coral" },
    ];
  }, [transactions, accounts, budgets, savingsGoals]);

  const mainPct = Math.round((data[0].current / data[0].target) * 100);

  return (
    <div className="glass-card card-glow-mint p-6 animate-fade-up-delay-2 h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Monthly Progress</p>
          <h3 className="text-2xl font-heading font-bold mt-1 text-foreground">{mainPct}%</h3>
        </div>
        <span className="chip">
          <span className="h-1.5 w-1.5 rounded-full bg-mint" />
          Live
        </span>
      </div>

      <div className="space-y-5">
        {data.map((goal) => {
          const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
          return (
            <div key={goal.label}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">{goal.label}</span>
                <span className="text-xs font-medium text-foreground">{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${goal.color} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">₹{goal.current.toLocaleString()}</span>
                <span className="text-[10px] text-muted-foreground">₹{goal.target.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetProgressCard;
