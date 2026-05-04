import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Account {
  id: string;
  name: string;
  type: "bank" | "wallet";
  balance: number;
}

export interface Profile {
  name: string;
  email: string;
  bio: string;
  avatar: string;
}

interface FinancialContextType {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  accounts: Account[];
  addAccount: (account: Omit<Account, "id">) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  processTransaction: (type: "income" | "expense", amount: number, accountId: string) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<Profile>(() => {
    const saved = localStorage.getItem("pw-profile");
    return saved ? JSON.parse(saved) : {
      name: "John Doe",
      email: "john.doe@example.com",
      bio: "Passionate about financial freedom and smart spending.",
      avatar: ""
    };
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem("pw-accounts");
    return saved ? JSON.parse(saved) : [
      { id: "1", name: "HDFC Bank", type: "bank", balance: 5000 },
      { id: "2", name: "Personal Wallet", type: "wallet", balance: 500 }
    ];
  });

  useEffect(() => {
    localStorage.setItem("pw-profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("pw-accounts", JSON.stringify(accounts));
  }, [accounts]);

  const addAccount = (account: Omit<Account, "id">) => {
    setAccounts([...accounts, { ...account, id: Date.now().toString() }]);
  };

  const updateAccount = (id: string, updated: Partial<Account>) => {
    setAccounts(accounts.map(a => a.id === id ? { ...a, ...updated } : a));
  };

  const deleteAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const processTransaction = (type: "income" | "expense", amount: number, accountId: string) => {
    setAccounts(prev => prev.map(a => {
      if (a.id === accountId) {
        return {
          ...a,
          balance: type === "income" ? a.balance + amount : a.balance - amount
        };
      }
      return a;
    }));
  };

  return (
    <FinancialContext.Provider value={{ 
      profile, setProfile, 
      accounts, addAccount, updateAccount, deleteAccount,
      processTransaction 
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
