import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { AccountBalances, getAccountBalances, updateBalances } from "@/services/accounts";
import { Transaction, getTransactions, addTransaction as serviceAddTransaction, deleteTransaction as serviceDeleteTransaction } from "@/services/transactions";
import { Budget, SavingsGoal, getBudgets, upsertBudget as serviceUpsertBudget, getSavingsGoals, addSavingsGoal as serviceAddGoal, updateSavingsGoal as serviceUpdateGoal, deleteSavingsGoal as serviceDeleteGoal } from "@/services/goals";
import { EMI, getEMIs, addEMI as serviceAddEMI, updateEMI as serviceUpdateEMI, deleteEMI as serviceDeleteEMI } from "@/services/emis";
import { getProfile as serviceGetProfile, updateProfile as serviceUpdateProfile } from "@/services/profile";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

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
  updateEMI: (id: string, updates: Partial<EMI>) => Promise<void>;
  deleteEMI: (id: string) => Promise<void>;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    name: "User",
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

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    try {
      const updated = await serviceUpdateProfile({
        full_name: updates.name,
        bio: updates.bio,
        avatar_url: updates.avatar,
      });
      setProfile({
        name: updated.full_name || "User",
        email: updated.email || user.email || "",
        bio: updated.bio || "",
        avatar: updated.avatar_url || "",
      });
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
      
      const profilePromise = serviceGetProfile().catch(e => {
        console.error("Failed to fetch profile", e);
        return null;
      });
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
        return [];
      });

      const [profileData, balancesRaw, transactionsRaw, budgetsRaw, goalsRaw, emisRaw] = await Promise.all([
        profilePromise,
        balancesPromise,
        transactionsPromise,
        budgetsPromise,
        goalsPromise,
        emisPromise
      ]);

      const balancesData = balancesRaw ? { ...balancesRaw, bank: Number(balancesRaw.bank), wallet: Number(balancesRaw.wallet) } : null;
      const transactionsData = transactionsRaw.map(t => ({ ...t, amount: Number(t.amount) }));
      const budgetsData = budgetsRaw.map(b => ({ ...b, limit_amount: Number(b.limit_amount) }));
      const goalsData = goalsRaw.map(g => ({ ...g, target_amount: Number(g.target_amount), current_amount: Number(g.current_amount) }));
      const emisData = emisRaw.map(e => ({ ...e, principal: Number(e.principal), emi_amount: Number(e.emi_amount), interest_rate: Number(e.interest_rate) }));

      if (profileData) {
        setProfile({
          name: profileData.full_name || "User",
          email: profileData.email || user.email || "",
          bio: profileData.bio || "",
          avatar: profileData.avatar_url || "",
        });
      }
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
      const rawTx = await serviceAddTransaction(transactionData);
      const newTransaction = { ...rawTx, amount: Number(rawTx.amount) };
      setTransactions(prev => [newTransaction, ...prev]);
      
      const type = transactionData.type === 'expense' ? transactionData.source : transactionData.destination;
      if (type === 'bank' || type === 'wallet') {
        const currentBalance = balances?.[type] || 0;
        const newBalance = transactionData.type === "income" 
          ? currentBalance + transactionData.amount 
          : currentBalance - transactionData.amount;
        
        const rawUpdated = await updateBalances({ [type]: newBalance });
        const updated = { ...rawUpdated, bank: Number(rawUpdated.bank), wallet: Number(rawUpdated.wallet) };
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

        const rawUpdated = await updateBalances({ [type]: newBalance });
        const updated = { ...rawUpdated, bank: Number(rawUpdated.bank), wallet: Number(rawUpdated.wallet) };
        setBalances(updated);
      }

      toast.success("Transaction deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete transaction: " + error.message);
    }
  };

  const updateBalance = async (type: "bank" | "wallet", amount: number) => {
    try {
      const rawUpdated = await updateBalances({ [type]: amount });
      const updated = { ...rawUpdated, bank: Number(rawUpdated.bank), wallet: Number(rawUpdated.wallet) };
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
      const rawBudget = await serviceUpsertBudget({ category, limit_amount, month });
      const newBudget = { ...rawBudget, limit_amount: Number(rawBudget.limit_amount) };
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
      const rawGoal = await serviceAddGoal(goal);
      const newGoal = { ...rawGoal, target_amount: Number(rawGoal.target_amount), current_amount: Number(rawGoal.current_amount) };
      setSavingsGoals(prev => [...prev, newGoal]);
      toast.success("Savings goal added");
    } catch (error: any) {
      toast.error("Failed to add goal: " + error.message);
      throw error;
    }
  };

  const updateSavingsGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    try {
      const rawGoal = await serviceUpdateGoal(id, updates);
      const updatedGoal = { ...rawGoal, target_amount: Number(rawGoal.target_amount), current_amount: Number(rawGoal.current_amount) };
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
      const rawEMI = await serviceAddEMI(emi);
      const newEMI = { ...rawEMI, principal: Number(rawEMI.principal), emi_amount: Number(rawEMI.emi_amount), interest_rate: Number(rawEMI.interest_rate) };
      setEmis(prev => [...prev, newEMI]);
      toast.success("EMI scheduled successfully!");
    } catch (error: any) {
      toast.error("Failed to schedule EMI: " + error.message);
      throw error;
    }
  };
  const updateEMI = async (id: string, updates: Partial<EMI>) => {
    try {
      const rawEMI = await serviceUpdateEMI(id, updates);
      const updatedEMI = { ...rawEMI, principal: Number(rawEMI.principal), emi_amount: Number(rawEMI.emi_amount), interest_rate: Number(rawEMI.interest_rate) };
      setEmis(prev => prev.map(e => e.id === id ? updatedEMI : e));
      toast.success("EMI updated successfully!");
    } catch (error: any) {
      toast.error("Failed to update EMI: " + error.message);
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
      addEMI, updateEMI, deleteEMI
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
