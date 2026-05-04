import { useState } from "react";
import Layout from "@/components/Layout";
import { TrendingUp, Briefcase, Gift, Landmark, ArrowUpRight, Plus, Filter, Search, MoreHorizontal, Calendar as CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useFinancial } from "@/lib/FinancialContext";
import { toast } from "sonner";

type IncomeCategory = "Income" | "Others";
const allCategories: IncomeCategory[] = ["Income", "Others"];

const categoryIcons: Record<IncomeCategory, typeof Briefcase> = {
  Income: Briefcase,
  Others: MoreHorizontal,
};

const Income = () => {
  const { accounts, processTransaction } = useFinancial();
  const [incomes, setIncomes] = useState([
    { id: 1, title: "Salary", category: "Income" as IncomeCategory, amount: 4500, date: "1st Feb", destination: "Bank account", description: "Company Inc.", growth: "+3.2%" },
    { id: 2, title: "Freelance Project", category: "Income" as IncomeCategory, amount: 1200, date: "5th Feb", destination: "Bank account", description: "Client A", growth: "+15%" },
  ]);
  const [open, setOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<IncomeCategory | "All">("All");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<IncomeCategory>("Income");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());

  const filtered = filterCategory === "All" ? incomes : incomes.filter((i) => i.category === filterCategory);
  const total = filtered.reduce((s, i) => s + i.amount, 0);

  const handleAdd = () => {
    if (!amount || !date || !accountId) return;
    const numAmount = parseFloat(amount);
    const selectedAccount = accounts.find(a => a.id === accountId);
    
    const newInc = {
      id: Date.now(),
      title: description || category,
      category,
      amount: numAmount,
      date: format(date, "PPP"),
      destination: selectedAccount?.name || "Account",
      description,
      growth: null as string | null,
    };

    processTransaction("income", numAmount, accountId);
    setIncomes([newInc, ...incomes]);
    setOpen(false);
    setAmount("");
    setDescription("");
    setDate(new Date());
    toast.success(`$${numAmount} added to ${selectedAccount?.name}`);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto relative pb-20">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-wider text-foreground">Income</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your earnings and revenue streams</p>
        </div>

        <div className="glass-card card-glow-yellow p-6 mb-6 animate-fade-up">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">Total Income This Month</p>
          <h2 className="text-3xl font-heading font-bold mt-1 text-foreground">${total.toLocaleString()}</h2>
          <p className="text-xs text-yellow mt-2 flex items-center gap-1">
            <ArrowUpRight className="h-3.5 w-3.5" /> +8.4% from last month
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-3 mb-6">
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as IncomeCategory | "All")}>
            <SelectTrigger className="w-auto rounded-full bg-muted border-none gap-2 px-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              {allCategories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {filtered.map((inc, i) => {
            const Icon = categoryIcons[inc.category];
            return (
              <div
                key={inc.id}
                className="glass-card p-4 flex items-center gap-4 animate-fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow/20">
                  <Icon className="h-5 w-5 text-yellow" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{inc.title}</p>
                  <p className="text-xs text-muted-foreground">{inc.description} · {inc.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">+${inc.amount.toLocaleString()}</p>
                  {inc.growth && (
                    <span className="inline-flex items-center rounded-full bg-yellow/10 px-2 py-0.5 text-[10px] font-medium text-yellow">
                      {inc.growth}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Add Button */}
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 h-14 w-14 rounded-full bg-yellow text-background flex items-center justify-center shadow-lg hover:scale-105 transition-transform btn-press z-50"
        >
          <Plus className="h-6 w-6" />
        </button>

        {/* Add Income Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="glass-card border-border" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="font-heading uppercase tracking-wider">Add Income</DialogTitle>
              <DialogDescription>Enter income details below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Amount</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as IncomeCategory)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allCategories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Destination Account</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} (${account.balance})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Input placeholder="e.g. Monthly salary" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Date</Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[60]" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <Button onClick={handleAdd} className="w-full bg-yellow hover:bg-yellow/90 text-background">Add Income</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Income;
