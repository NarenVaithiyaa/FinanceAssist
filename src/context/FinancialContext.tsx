import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { AccountBalances, getAccountBalances, updateBalances } from "@/services/accounts";
import { Transaction, getTransactions, addTransaction as serviceAddTransaction, deleteTransaction as serviceDeleteTransaction } from "@/services/transactions";
import { Budget, SavingsGoal, getBudgets, upsertBudget as serviceUpsertBudget, getSavingsGoals, addSavingsGoal as serviceAddGoal, updateSavingsGoal as serviceUpdateGoal, deleteSavingsGoal as serviceDeleteGoal } from "@/services/goals"; // Use goals.ts directly
import { EMI, getEMIs, addEMI as serviceAddEMI, deleteEMI as serviceDeleteEMI } from "@/services/emis";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";

export interface Profile {
  name: string;
  email: string;
  bio: string;
  avatar: string;
}

export interface Account {
  id: string;
  name: string;
  type: "bank" | "wallet";
  balance: number;
}

interface FinancialContextType {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  emis: EMI[];
  loading: boolean;
  refreshData: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  processTransaction: (transaction: Omit<Transaction, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateBalance: (type: "bank" | "wallet", amount: number) => Promise<void>;
  upsertBudget: (limit_amount: number, category?: string) => Promise<void>;
  addSavingsGoal: (goal: Omit<SavingsGoal, "id" | "user_id">) => Promise<void>;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  addEMI: (emi: Omit<EMI, "id" | "user_id" | "created_at">) => Promise<void>;
  deleteEMI: (id: string) => Promise<void>;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    name: user?.user_metadata?.full_name || "User",
    email: user?.email || "",
    bio: "",
    avatar: ""
  });

  const [balances, setBalances] = useState<AccountBalances | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [emis, setEmis] = useState<EMI[]>([]);
  const [loading, setLoading] = useState(false);

  const accounts = useMemo(() => [
    { id: "bank", name: "Bank Account", type: "bank" as const, balance: balances?.bank || 0 },
    { id: "wallet", name: "Personal Wallet", type: "wallet" as const, balance: balances?.wallet || 0 }
  ], [balances]);

  // Load user profile from auth metadata
  useEffect(() => {
    if (user?.user_metadata) {
      setProfile({
        name: user.user_metadata.full_name || "User",
        email: user.email || "",
        bio: user.user_metadata.bio || "",
        avatar: user.user_metadata.avatar_url || ""
      });
    }
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: updates.name,
          bio: updates.bio,
          avatar_url: updates.avatar
        }
      });
      if (error) throw error;
      setProfile(prev => ({ ...prev, ...updates }));
      toast.success("Profile saved securely!");
    } catch (e: any) {
      toast.error("Failed to update profile: " + e.message);
    }
  };

  const fetchData = useCallback(async () => {
    if (!user) {
      // Clear data on logout
      setBalances(null);
      setTransactions([]);
      setBudgets([]);
      setSavingsGoals([]);
      setEmis([]);
      setProfile({ name: "User", email: "", bio: "", avatar: "" });
      return;
    }
    setLoading(true);
    try {
      const currentMonth = format(new Date(), "yyyy-MM");
      
      const balancesPromise = getAccountBalances().catch(e => {
        console.error("Failed to fetch balances", e);
        return { bank: 0, wallet: 0 };
      });
      const transactionsPromise = getTransactions().catch(e => {
        console.error("Failed to fetch transactions", e);
        return [];
      });
      const budgetsPromise = getBudgets(currentMonth).catch(e => {
        console.error("Failed to fetch budgets", e);
        return [];
      });
      const goalsPromise = getSavingsGoals().catch(e => {
        console.error("Failed to fetch goals", e);
        return [];
      });
      const emisPromise = getEMIs().catch(e => {
        console.error("Failed to fetch emis", e);
        toast.error("EMI table missing in database. Please run SQL setup script.");
        return [];
      });

      const [balancesData, transactionsData, budgetsData, goalsData, emisData] = await Promise.all([
        balancesPromise,
        transactionsPromise,
        budgetsPromise,
        goalsPromise,
        emisPromise
      ]);

      setBalances(balancesData);
      setTransactions(transactionsData);
      setBudgets(budgetsData);
      setSavingsGoals(goalsData);
      setEmis(emisData);
    } catch (error: any) {
      toast.error("Failed to fetch financial data: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const processTransaction = async (transactionData: Omit<Transaction, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      const newTransaction = await serviceAddTransaction(transactionData);
      setTransactions(prev => [newTransaction, ...prev]);
      
      const type = transactionData.type === 'expense' ? transactionData.source : transactionData.destination;
      if (type === 'bank' || type === 'wallet') {
        const currentBalance = balances?.[type] || 0;
        const newBalance = transactionData.type === "income" 
          ? currentBalance + transactionData.amount 
          : currentBalance - transactionData.amount;
        
        const updated = await updateBalances({ [type]: newBalance });
        setBalances(updated);
      }
      
      toast.success(`${transactionData.type === "income" ? "Income" : "Expense"} added successfully`);
    } catch (error: any) {
      toast.error("Failed to process transaction: " + error.message);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const tToDelete = transactions.find(t => t.id === id);
      if (!tToDelete) return;

      await serviceDeleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));

      const type = tToDelete.type === 'expense' ? tToDelete.source : tToDelete.destination;
      if (type === 'bank' || type === 'wallet') {
        const currentBalance = balances?.[type] || 0;
        const newBalance = tToDelete.type === "income"
          ? currentBalance - tToDelete.amount
          : currentBalance + tToDelete.amount;

        const updated = await updateBalances({ [type]: newBalance });
        setBalances(updated);
      }

      toast.success("Transaction deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete transaction: " + error.message);
    }
  };

  const updateBalance = async (type: "bank" | "wallet", amount: number) => {
    try {
      const updated = await updateBalances({ [type]: amount });
      setBalances(updated);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} balance updated`);
    } catch (error: any) {
      console.error("Error updating balance:", error);
      toast.error("Failed to update balance: " + error.message);
    }
  };

  const upsertBudget = async (limit_amount: number, category: string = "Total") => {
    try {
      const month = format(new Date(), "yyyy-MM");
      const newBudget = await serviceUpsertBudget({ category, limit_amount, month });
      setBudgets(prev => {
        const filtered = prev.filter(b => b.category !== category || b.month !== month);
        return [...filtered, newBudget];
      });
      toast.success(`Budget updated for ${month}`);
    } catch (error: any) {
      console.error("Error updating budget:", error);
      toast.error("Failed to update budget: " + error.message);
    }
  };

  const addSavingsGoal = async (goal: Omit<SavingsGoal, "id" | "user_id">) => {
    try {
      const newGoal = await serviceAddGoal(goal);
      setSavingsGoals(prev => [...prev, newGoal]);
      toast.success("Savings goal added");
    } catch (error: any) {
      toast.error("Failed to add goal: " + error.message);
      throw error;
    }
  };

  const updateSavingsGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    try {
      const updatedGoal = await serviceUpdateGoal(id, updates);
      setSavingsGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
      toast.success("Goal updated");
    } catch (error: any) {
      toast.error("Failed to update goal: " + error.message);
      throw error;
    }
  };

  const deleteSavingsGoal = async (id: string) => {
    try {
      await serviceDeleteGoal(id);
      setSavingsGoals(prev => prev.filter(g => g.id !== id));
      toast.success("Goal deleted");
    } catch (error: any) {
      toast.error("Failed to delete goal: " + error.message);
      throw error;
    }
  };

  const addEMI = async (emi: Omit<EMI, "id" | "user_id" | "created_at">) => {
    try {
      const newEMI = await serviceAddEMI(emi);
      setEmis(prev => [...prev, newEMI]);
      toast.success("EMI scheduled successfully!");
    } catch (error: any) {
      toast.error("Failed to schedule EMI: " + error.message);
      throw error;
    }
  };

  const deleteEMI = async (id: string) => {
    try {
      await serviceDeleteEMI(id);
      setEmis(prev => prev.filter(g => g.id !== id));
      toast.success("EMI removed successfully");
    } catch (error: any) {
      toast.error("Failed to remove EMI: " + error.message);
    }
  };

  return (
    <FinancialContext.Provider value={{ 
      profile, setProfile, updateProfile,
      accounts, transactions, budgets, savingsGoals, emis, loading,
      refreshData: fetchData,
      processTransaction, deleteTransaction,
      updateBalance,
      upsertBudget,
      addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
      addEMI, deleteEMI
    }}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) throw new Error("useFinancial must be used within FinancialProvider");
  return context;
};
