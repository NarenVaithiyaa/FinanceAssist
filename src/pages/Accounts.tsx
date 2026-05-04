import { useState } from "react";
import Layout from "@/components/Layout";
import { Landmark, Wallet, Plus, Trash2, ChevronLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useFinancial, Account } from "@/lib/FinancialContext";
import { toast } from "sonner";

const AccountsPage = () => {
  const navigate = useNavigate();
  const { accounts, addAccount, updateAccount, deleteAccount } = useFinancial();
  
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"bank" | "wallet">("bank");
  const [balance, setBalance] = useState("");

  const handleSave = () => {
    if (!name || !balance) return;
    
    if (editingId) {
      updateAccount(editingId, { name, type, balance: parseFloat(balance) });
      toast.success("Account updated!");
    } else {
      addAccount({ name, type, balance: parseFloat(balance) });
      toast.success("Account added!");
    }
    
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setType("bank");
    setBalance("");
    setEditingId(null);
  };

  const handleEdit = (account: Account) => {
    setName(account.name);
    setType(account.type);
    setBalance(account.balance.toString());
    setEditingId(account.id);
    setOpen(true);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto pb-20">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/settings")}
            className="rounded-full hover:bg-muted"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-wider text-foreground">Banks & Wallets</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your financial sources</p>
          </div>
        </div>

        <div className="space-y-4">
          {accounts.map((account) => (
            <div key={account.id} className="glass-card p-5 flex items-center justify-between group animate-fade-up">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${account.type === 'bank' ? 'bg-purple/10 text-purple' : 'bg-yellow/10 text-yellow'}`}>
                  {account.type === 'bank' ? <Landmark className="h-6 w-6" /> : <Wallet className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-foreground">{account.name}</h3>
                  <p className="text-sm text-muted-foreground">${account.balance.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(account)} className="rounded-xl hover:bg-muted">
                  <Plus className="h-4 w-4 rotate-45" /> {/* Use as edit or generic action */}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteAccount(account.id)} className="rounded-xl hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button 
            onClick={() => { resetForm(); setOpen(true); }}
            className="w-full h-14 border-dashed border-2 bg-transparent hover:bg-muted/30 text-muted-foreground rounded-3xl"
            variant="outline"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add New Account or Wallet
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="glass-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading uppercase tracking-wider">
                {editingId ? "Edit Account" : "Add Account"}
              </DialogTitle>
              <DialogDescription>Enter account or wallet details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Name</Label>
                <Input placeholder="e.g. HDFC Bank or Paytm Wallet" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Type</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Button 
                    variant={type === 'bank' ? 'default' : 'outline'} 
                    onClick={() => setType('bank')}
                    className={type === 'bank' ? 'bg-coral hover:bg-coral/90' : ''}
                  >
                    Bank Account
                  </Button>
                  <Button 
                    variant={type === 'wallet' ? 'default' : 'outline'} 
                    onClick={() => setType('wallet')}
                    className={type === 'wallet' ? 'bg-coral hover:bg-coral/90' : ''}
                  >
                    Wallet
                  </Button>
                </div>
              </div>
              <div>
                <Label>Current Balance</Label>
                <Input type="number" placeholder="0.00" value={balance} onChange={(e) => setBalance(e.target.value)} className="mt-1" />
              </div>
              <Button onClick={handleSave} className="w-full bg-coral hover:bg-coral/90 text-white mt-4">
                {editingId ? "Update Account" : "Add Account"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AccountsPage;
