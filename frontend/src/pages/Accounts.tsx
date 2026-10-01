import { useState } from "react";
import Layout from "@/components/Layout";
import { Landmark, Wallet, Plus, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useFinancial } from "@/context/FinancialContext";
import { toast } from "sonner";

const AccountsPage = () => {
  const navigate = useNavigate();
  const { accounts, updateBalance, loading } = useFinancial();
  
  const [open, setOpen] = useState(false);
  const [editingType, setEditingType] = useState<"bank" | "wallet" | null>(null);
  const [balance, setBalance] = useState("");

  const handleSave = async () => {
    if (!balance || !editingType) return;
    
    await updateBalance(editingType, parseFloat(balance));
    
    setOpen(false);
    setBalance("");
    setEditingType(null);
  };

  const handleEdit = (type: "bank" | "wallet", currentBalance: number) => {
    setEditingType(type);
    setBalance(currentBalance.toString());
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

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="glass-card p-5 flex items-center justify-between group animate-fade-up">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${account.type === 'bank' ? 'bg-purple/10 text-purple' : 'bg-yellow/10 text-yellow'}`}>
                    {account.type === 'bank' ? <Landmark className="h-6 w-6" /> : <Wallet className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-foreground">{account.name}</h3>
                    <p className="text-sm text-muted-foreground">₹{account.balance.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleEdit(account.type, account.balance)} 
                    className="rounded-xl hover:bg-muted"
                  >
                    <Plus className="h-4 w-4 rotate-45" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="glass-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading uppercase tracking-wider">
                Edit {editingType === 'bank' ? 'Bank' : 'Wallet'} Balance
              </DialogTitle>
              <DialogDescription>Update your current balance manually.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Current Balance</Label>
                <Input type="number" placeholder="0.00" value={balance} onChange={(e) => setBalance(e.target.value)} className="mt-1" />
              </div>
              <Button onClick={handleSave} className="w-full bg-coral hover:bg-coral/90 text-white mt-4">
                Update Balance
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AccountsPage;
