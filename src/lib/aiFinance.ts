import type { Account, Profile } from "@/context/FinancialContext";
import type { Transaction } from "@/services/transactions";
import type { Budget, SavingsGoal } from "@/services/goals";
import type { EMI } from "@/services/emis";

export type CoachMessage = {
  role: "user" | "assistant";
  content: string;
};

export type FinancialSnapshot = {
  generatedAt: string;
  profile: Pick<Profile, "name" | "email">;
  accounts: Account[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  investments: SavingsGoal[];
  emis: EMI[];
  totals: {
    balance: number;
    income: number;
    expenses: number;
    net: number;
    savingsGoalTarget: number;
    savingsGoalCurrent: number;
    investmentTarget: number;
    investmentCurrent: number;
    monthlyEmiCommitment: number;
  };
  currentMonth: {
    month: string;
    income: number;
    expenses: number;
    net: number;
    budgetLimit: number;
    budgetUsedPct: number;
  };
  categorySummary: Array<{
    category: string;
    income: number;
    expenses: number;
  }>;
  monthlySummary: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>;
  recentTransactions: Array<Pick<Transaction, "amount" | "category" | "description" | "date" | "type" | "source" | "destination">>;
  omittedTransactions: number;
};

type SnapshotInput = {
  profile: Profile;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  emis: EMI[];
};

const normalizeMonth = (date: Date) => date.toISOString().slice(0, 7);

const getMonthFromTransaction = (transaction: Transaction) => transaction.date.slice(0, 7);

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const buildFinancialSnapshot = ({
  profile,
  accounts,
  transactions,
  budgets,
  savingsGoals,
  emis,
}: SnapshotInput): FinancialSnapshot => {
  const sortedTransactions = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const recentTransactions = sortedTransactions.slice(0, 120).map((transaction) => ({
    amount: Number(transaction.amount) || 0,
    category: transaction.category,
    description: transaction.description,
    date: transaction.date,
    type: transaction.type,
    source: transaction.source,
    destination: transaction.destination,
  }));

  const currentMonth = normalizeMonth(new Date());
  const currentMonthTransactions = transactions.filter((transaction) => getMonthFromTransaction(transaction) === currentMonth);

  const sumTransactions = (items: Transaction[], type: "income" | "expense") =>
    roundMoney(items.filter((transaction) => transaction.type === type).reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0));

  const totalIncome = sumTransactions(transactions, "income");
  const totalExpenses = sumTransactions(transactions, "expense");
  const currentMonthIncome = sumTransactions(currentMonthTransactions, "income");
  const currentMonthExpenses = sumTransactions(currentMonthTransactions, "expense");
  const currentBudgetLimit = Number(budgets.find((budget) => budget.category === "Total" && budget.month === currentMonth)?.limit_amount || 0);

  const categoryMap = new Map<string, { category: string; income: number; expenses: number }>();
  for (const transaction of transactions) {
    const entry = categoryMap.get(transaction.category) || { category: transaction.category, income: 0, expenses: 0 };
    if (transaction.type === "income") entry.income += Number(transaction.amount || 0);
    if (transaction.type === "expense") entry.expenses += Number(transaction.amount || 0);
    categoryMap.set(transaction.category, entry);
  }

  const monthMap = new Map<string, { month: string; income: number; expenses: number; net: number }>();
  for (const transaction of transactions) {
    const month = getMonthFromTransaction(transaction);
    const entry = monthMap.get(month) || { month, income: 0, expenses: 0, net: 0 };
    if (transaction.type === "income") entry.income += Number(transaction.amount || 0);
    if (transaction.type === "expense") entry.expenses += Number(transaction.amount || 0);
    entry.net = entry.income - entry.expenses;
    monthMap.set(month, entry);
  }

  const goals = savingsGoals.filter((goal) => goal.category !== "investment");
  const investments = savingsGoals.filter((goal) => goal.category === "investment");

  return {
    generatedAt: new Date().toISOString(),
    profile: {
      name: profile.name,
      email: profile.email,
    },
    accounts,
    budgets,
    savingsGoals: goals,
    investments,
    emis,
    totals: {
      balance: roundMoney(accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0)),
      income: totalIncome,
      expenses: totalExpenses,
      net: roundMoney(totalIncome - totalExpenses),
      savingsGoalTarget: roundMoney(goals.reduce((sum, goal) => sum + Number(goal.target_amount || 0), 0)),
      savingsGoalCurrent: roundMoney(goals.reduce((sum, goal) => sum + Number(goal.current_amount || 0), 0)),
      investmentTarget: roundMoney(investments.reduce((sum, goal) => sum + Number(goal.target_amount || 0), 0)),
      investmentCurrent: roundMoney(investments.reduce((sum, goal) => sum + Number(goal.current_amount || 0), 0)),
      monthlyEmiCommitment: roundMoney(emis.reduce((sum, emi) => sum + Number(emi.emi_amount || 0), 0)),
    },
    currentMonth: {
      month: currentMonth,
      income: currentMonthIncome,
      expenses: currentMonthExpenses,
      net: roundMoney(currentMonthIncome - currentMonthExpenses),
      budgetLimit: currentBudgetLimit,
      budgetUsedPct: currentBudgetLimit > 0 ? Math.round((currentMonthExpenses / currentBudgetLimit) * 100) : 0,
    },
    categorySummary: Array.from(categoryMap.values())
      .map((entry) => ({
        category: entry.category,
        income: roundMoney(entry.income),
        expenses: roundMoney(entry.expenses),
      }))
      .sort((a, b) => b.expenses + b.income - (a.expenses + a.income)),
    monthlySummary: Array.from(monthMap.values())
      .map((entry) => ({
        month: entry.month,
        income: roundMoney(entry.income),
        expenses: roundMoney(entry.expenses),
        net: roundMoney(entry.net),
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12),
    recentTransactions,
    omittedTransactions: Math.max(0, sortedTransactions.length - recentTransactions.length),
  };
};

import { supabase } from "./supabase";

export const requestFinanceCoach = async (payload: {
  mode: "chat" | "savings-suggestions";
  prompt: string;
  financialData: FinancialSnapshot;
  messages?: CoachMessage[];
}) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch("/api/finance-coach", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || "AI finance coach is unavailable right now.");
  }

  return String(body.text || "").trim();
};

export const splitSuggestionText = (text: string) => {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 4);
};

export const getDailySuggestionCacheKey = (email: string) => {
  const day = new Date().toISOString().slice(0, 10);
  return `pennywise:ai-savings-suggestions:${email || "anonymous"}:${day}`;
};
