import { Landmark, Wallet } from "lucide-react";
import { useFinancial } from "@/context/FinancialContext";

const AccountBalances = () => {
  const { accounts } = useFinancial();

  return (
    <div className="glass-card p-6 animate-fade-up-delay-2 lg:col-span-1 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-bold text-sm text-foreground uppercase tracking-tight">Account Balances</h3>
      </div>

      <div className="space-y-4">
        {accounts.map((account) => (
          <div key={account.id} className="p-4 rounded-2xl bg-muted/30 border border-border/50 flex items-center gap-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${account.type === 'bank' ? 'bg-purple/10 text-purple' : 'bg-yellow/10 text-yellow'}`}>
              {account.type === 'bank' ? <Landmark className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase font-bold truncate">{account.name}</p>
              <p className="text-sm font-heading font-bold text-foreground truncate">₹{account.balance.toLocaleString()}</p>
            </div>
          </div>
        ))}
        
        <div className="pt-4 border-t border-border/30 mt-4">
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Combined</p>
          <p className="text-xl font-heading font-bold text-foreground">
            ₹{accounts.reduce((s, a) => s + a.balance, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountBalances;
