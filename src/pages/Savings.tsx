import Layout from "@/components/Layout";
import { LineChart, Line, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Pencil, Plus, Sparkles, Target, Trash2, TrendingUp } from "lucide-react";
import { useFinancial } from "@/context/FinancialContext";
import { useEffect, useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isWithinInterval, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { SavingsGoal } from "@/services/goals";
import { buildFinancialSnapshot, getDailySuggestionCacheKey, requestFinanceCoach, splitSuggestionText } from "@/lib/aiFinance";

const normalizeInvestmentName = (value: string) => value.trim().toLowerCase();

const formatMoney = (amount: number) => `Rs ${amount.toLocaleString()}`;

const fallbackTips = [
  "Add income, expenses, budgets, and goals to unlock personalized savings suggestions.",
  "Set a monthly budget so your savings progress has a clear target.",
  "Create an investment or savings goal to track long-term progress.",
];

const Savings = () => {
  const { profile, accounts, transactions, budgets, savingsGoals, emis, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useFinancial();

  const [open, setOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [category, setCategory] = useState<"goal" | "investment">("goal");
  const [tips, setTips] = useState(fallbackTips);
  const [tipsLoading, setTipsLoading] = useState(false);

  const resetGoalForm = () => {
    setEditingGoal(null);
    setName("");
    setTargetAmount("");
    setCurrentAmount("");
    setCategory("goal");
  };

  const openAddDialog = (nextCategory: "goal" | "investment") => {
    resetGoalForm();
    setCategory(nextCategory);
    setOpen(true);
  };

  const openEditDialog = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(String(goal.target_amount));
    setCurrentAmount(String(goal.current_amount || 0));
    setCategory(goal.category === "investment" ? "investment" : "goal");
    setOpen(true);
  };

  const handleSaveGoal = async () => {
    if (!name || !targetAmount) {
      toast.error("Please fill in all fields");
      return;
    }

    const parsedTarget = parseFloat(targetAmount);
    const parsedCurrent = currentAmount ? parseFloat(currentAmount) : 0;

    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0 || !Number.isFinite(parsedCurrent) || parsedCurrent < 0) {
      toast.error("Enter valid goal amounts");
      return;
    }

    try {
      const goalData = {
        name: name.trim(),
        target_amount: parsedTarget,
        current_amount: parsedCurrent,
        category,
        color: category === "investment" ? "bg-coral" : "bg-violet",
      };

      if (editingGoal) {
        await updateSavingsGoal(editingGoal.id, goalData);
      } else {
        await addSavingsGoal(goalData);
      }

      setOpen(false);
      resetGoalForm();
    } catch (error) {
      // The context shows the Supabase error toast and keeps the form open.
    }
  };

  const handleDeleteGoal = async (goal: SavingsGoal) => {
    if (!window.confirm(`Delete "${goal.name}"?`)) return;

    try {
      await deleteSavingsGoal(goal.id);
    } catch (error) {
      // The context shows the Supabase error toast.
    }
  };

  const savingsData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: startOfMonth(subMonths(new Date(), 5)),
      end: endOfMonth(new Date()),
    });

    return months.map(monthDate => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthTransactions = transactions.filter(t => {
        const tDate = parseISO(t.date);
        return isWithinInterval(tDate, { start: monthStart, end: monthEnd });
      });

      const income = monthTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = monthTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: format(monthDate, "MMM"),
        amount: income - expense,
      };
    });
  }, [transactions]);

  const currentMonthSavings = savingsData[savingsData.length - 1]?.amount || 0;

  const actualGoals = useMemo(() => savingsGoals.filter(g => g.category !== "investment"), [savingsGoals]);
  const actualInvestments = useMemo(() => savingsGoals.filter(g => g.category === "investment"), [savingsGoals]);

  const investmentExpensesByName = useMemo(() => {
    return transactions
      .filter(t => t.type === "expense" && t.category === "Investment")
      .reduce<Record<string, number>>((totals, transaction) => {
        const key = normalizeInvestmentName(transaction.description || "");
        if (!key) return totals;

        totals[key] = (totals[key] || 0) + transaction.amount;
        return totals;
      }, {});
  }, [transactions]);

  const investmentProgress = useMemo(() => {
    return actualInvestments.map(goal => {
      const baseAmount = Number(goal.current_amount) || 0;
      const matchedExpenseAmount = investmentExpensesByName[normalizeInvestmentName(goal.name)] || 0;

      return {
        ...goal,
        displayCurrentAmount: baseAmount + matchedExpenseAmount,
      };
    });
  }, [actualInvestments, investmentExpensesByName]);

  const totalInvestmentCurrent = investmentProgress.reduce((sum, goal) => sum + goal.displayCurrentAmount, 0);
  const totalInvestmentTarget = actualInvestments.reduce((sum, goal) => sum + Number(goal.target_amount), 0);
  const totalInvestmentPct = totalInvestmentTarget > 0
    ? Math.min(100, Math.round((totalInvestmentCurrent / totalInvestmentTarget) * 100))
    : 0;

  const financialData = useMemo(() => buildFinancialSnapshot({
    profile,
    accounts,
    transactions,
    budgets,
    savingsGoals,
    emis,
  }), [profile, accounts, transactions, budgets, savingsGoals, emis]);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = getDailySuggestionCacheKey(profile.email);
    const cachedTips = localStorage.getItem(cacheKey);

    if (cachedTips) {
      try {
        const parsedTips = JSON.parse(cachedTips);
        if (Array.isArray(parsedTips) && parsedTips.length > 0) {
          setTips(parsedTips);
          return;
        }
      } catch (error) {
        localStorage.removeItem(cacheKey);
      }
    }

    const loadDailyTips = async () => {
      setTipsLoading(true);
      try {
        const response = await requestFinanceCoach({
          mode: "savings-suggestions",
          prompt: "Generate today's smart savings suggestions.",
          financialData,
        });
        const parsedTips = splitSuggestionText(response);

        if (!cancelled && parsedTips.length > 0) {
          setTips(parsedTips);
          localStorage.setItem(cacheKey, JSON.stringify(parsedTips));
        }
      } catch (error: any) {
        if (!cancelled) {
          setTips(fallbackTips);
          toast.error(error.message || "Could not load AI savings suggestions.");
        }
      } finally {
        if (!cancelled) setTipsLoading(false);
      }
    };

    loadDailyTips();

    return () => {
      cancelled = true;
    };
  }, [financialData, profile.email]);

  const renderGoalRow = (goal: SavingsGoal & { displayCurrentAmount?: number }, fallbackColor: string) => {
    const currentAmt = Number(goal.displayCurrentAmount ?? goal.current_amount) || 0;
    const targetAmt = Number(goal.target_amount) || 1;
    const pct = Math.min(100, Math.round((currentAmt / targetAmt) * 100));

    return (
      <div key={goal.id}>
        <div className="flex justify-between mb-2 gap-3">
          <span className="text-sm text-foreground truncate">{goal.name}</span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">{formatMoney(currentAmt)} / {formatMoney(targetAmt)}</span>
            <button onClick={() => openEditDialog(goal)} className="p-1 rounded-md hover:bg-muted transition-colors" title="Edit">
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button onClick={() => handleDeleteGoal(goal)} className="p-1 rounded-md hover:bg-destructive/20 transition-colors" title="Delete">
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full ${goal.color || fallbackColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-wider text-foreground">Savings</h1>
          <p className="text-sm text-muted-foreground mt-1">Insights for your savings goals</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-card card-glow-violet p-6 animate-fade-up">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Monthly Net Savings</p>
            <h3 className="text-2xl font-heading font-bold text-foreground">{formatMoney(currentMonthSavings)}</h3>
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

          <div className="glass-card p-6 animate-fade-up-delay-1">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-violet" />
                <p className="text-sm font-heading font-semibold text-foreground uppercase tracking-wider">Savings Goals</p>
              </div>
              <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs" onClick={() => openAddDialog("goal")}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Goal
              </Button>
            </div>

            <div className="space-y-5">
              {actualGoals.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                  No saving goals yet
                </div>
              )}
              {actualGoals.map(goal => renderGoalRow(goal, "bg-violet"))}
            </div>

            <div className="flex items-center justify-between mb-5 mt-8 border-t border-border/30 pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-coral" />
                <p className="text-sm font-heading font-semibold text-foreground uppercase tracking-wider">Investments</p>
              </div>
              <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs" onClick={() => openAddDialog("investment")}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Investment
              </Button>
            </div>

            <div className="space-y-5">
              {actualInvestments.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                  No investments yet
                </div>
              )}
              {actualInvestments.length > 0 && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-foreground">Tracked Investment Progress</span>
                    <span className="text-xs text-muted-foreground">{formatMoney(totalInvestmentCurrent)} / {formatMoney(totalInvestmentTarget)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-coral transition-all duration-700" style={{ width: `${totalInvestmentPct}%` }} />
                  </div>
                </div>
              )}
              {investmentProgress.map(goal => renderGoalRow(goal, "bg-coral"))}
            </div>
          </div>

          <div className="glass-card card-glow-violet p-6 lg:col-span-2 animate-fade-up-delay-2">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-violet" />
              <p className="text-sm font-heading font-semibold text-foreground uppercase tracking-wider">Smart Suggestions</p>
              {tipsLoading && <span className="text-[11px] text-muted-foreground">Refreshing...</span>}
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

      <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) resetGoalForm(); }}>
        <DialogContent className="glass-card border-border" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="font-heading uppercase tracking-wider">{editingGoal ? "Edit" : "Add"} {category === "goal" ? "Goal" : "Investment"}</DialogTitle>
            <DialogDescription>Enter the details for your {category}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Type</Label>
              <Select value={category} onValueChange={(v: "goal" | "investment") => setCategory(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="goal">Savings Goal</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Name</Label>
              <Input placeholder="e.g. Emergency Fund, Stocks" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Target Amount</Label>
              <Input type="number" placeholder="0.00" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Current Amount</Label>
              <Input type="number" placeholder="0.00" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} className="mt-1" />
            </div>
            <Button onClick={handleSaveGoal} className="w-full bg-violet hover:bg-violet/90 text-white">
              {editingGoal ? "Save" : "Add"} {category === "goal" ? "Goal" : "Investment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Savings;
