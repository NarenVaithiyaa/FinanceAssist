import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Search, Filter, Pencil, Trash2, ShoppingCart, Utensils, Car, Gamepad2, Zap, MoreHorizontal, Plus, GraduationCap, Users, Heart, User, X, CreditCard, Calendar as CalendarIcon, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { format, differenceInMonths, addMonths, isAfter } from "date-fns";
import { cn } from "@/lib/utils";
import { useFinancial } from "@/lib/FinancialContext";
import { toast } from "sonner";

const categoryConfig = {
  Education: { icon: GraduationCap, color: "bg-purple" },
  Entertainment: { icon: Gamepad2, color: "bg-violet" },
  Food: { icon: Utensils, color: "bg-coral" },
  Friends: { icon: Users, color: "bg-yellow" },
  Health: { icon: Heart, color: "bg-mint" },
  Personal: { icon: User, color: "bg-soft-blue" },
  Others: { icon: MoreHorizontal, color: "bg-muted" },
} as const;

type ExpenseCategory = keyof typeof categoryConfig;

const allCategories: ExpenseCategory[] = ["Education", "Entertainment", "Food", "Friends", "Health", "Personal", "Others"];

const initialExpenses = [
  { id: 1, title: "Grocery Store", category: "Food" as ExpenseCategory, amount: 84.50, date: "Today", source: "Wallet", description: "" },
  { id: 2, title: "Uber Ride", category: "Personal" as ExpenseCategory, amount: 24.00, date: "Today", source: "Wallet", description: "" },
  { id: 3, title: "Netflix", category: "Entertainment" as ExpenseCategory, amount: 15.99, date: "Yesterday", source: "Bank account", description: "" },
  { id: 4, title: "Electric Bill", category: "Others" as ExpenseCategory, amount: 120.00, date: "Yesterday", source: "Bank account", description: "" },
  { id: 5, title: "Amazon", category: "Personal" as ExpenseCategory, amount: 67.30, date: "2 days ago", source: "Bank account", description: "" },
  { id: 6, title: "Restaurant", category: "Food" as ExpenseCategory, amount: 52.80, date: "3 days ago", source: "Wallet", description: "" },
];

interface EMI {
  id: number;
  name: string;
  principal: number;
  months: number;
  emiAmount: number;
  interestRate?: number;
  startDate: Date;
}

const Expenses = () => {
  const { accounts, processTransaction } = useFinancial();
  const [expenses, setExpenses] = useState(initialExpenses);
  const [open, setOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | "All">("All");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Food");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());

  // EMI State
  const [emis, setEmis] = useState<EMI[]>([]);
  const [emiOpen, setEmiOpen] = useState(false);
  const [emiName, setEmiName] = useState("");
  const [emiPrincipal, setEmiPrincipal] = useState("");
  const [emiMonths, setEmiMonths] = useState("");
  const [emiAmountEachMonth, setEmiAmountEachMonth] = useState("");
  const [emiInterest, setEmiInterest] = useState("");
  const [emiStartDate, setEmiStartDate] = useState<Date | undefined>(new Date());

  const [searchQuery, setSearchQuery] = useState("");

  const filtered = (filterCategory === "All" ? expenses : expenses.filter((e) => e.category === filterCategory))
    .filter((e) => 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleAdd = () => {
    if (!amount || !date || !accountId) return;
    const numAmount = parseFloat(amount);
    const selectedAccount = accounts.find(a => a.id === accountId);

    const newExp = {
      id: Date.now(),
      title: description || category,
      category,
      amount: numAmount,
      date: format(date, "PPP"),
      source: selectedAccount?.name || "Account",
      description,
    };

    processTransaction("expense", numAmount, accountId);
    setExpenses([newExp, ...expenses]);
    setOpen(false);
    setAmount("");
    setDescription("");
    setDate(new Date());
    toast.success(`$${numAmount} paid from ${selectedAccount?.name}`);
  };

  const handleAddEMI = () => {
    if (!emiName || !emiPrincipal || !emiMonths || !emiAmountEachMonth || !emiStartDate) return;
    const newEMI: EMI = {
      id: Date.now(),
      name: emiName,
      principal: parseFloat(emiPrincipal),
      months: parseInt(emiMonths),
      emiAmount: parseFloat(emiAmountEachMonth),
      interestRate: emiInterest ? parseFloat(emiInterest) : undefined,
      startDate: emiStartDate,
    };
    setEmis([...emis, newEMI]);
    setEmiOpen(false);
    setEmiName("");
    setEmiPrincipal("");
    setEmiMonths("");
    setEmiAmountEachMonth("");
    setEmiInterest("");
    setEmiStartDate(new Date());
  };

  const calculateEMIProgress = (emi: EMI) => {
    const now = new Date();
    const monthsCompleted = Math.max(0, Math.min(emi.months, differenceInMonths(now, emi.startDate)));
    const monthsPending = emi.months - monthsCompleted;
    
    const amountPaid = monthsCompleted * emi.emiAmount;
    const totalRepayment = emi.months * emi.emiAmount;
    const amountLeft = totalRepayment - amountPaid;
    
    const nextDueDate = addMonths(emi.startDate, monthsCompleted);
    const displayDueDate = isAfter(nextDueDate, now) ? nextDueDate : addMonths(nextDueDate, 1);
    
    const isCompleted = monthsCompleted === emi.months;

    return {
      monthsCompleted,
      monthsPending,
      amountPaid,
      amountLeft,
      nextDueDate: displayDueDate,
      totalAmount: totalRepayment,
      monthProgress: (monthsCompleted / emi.months) * 100,
      amountProgress: (amountPaid / totalRepayment) * 100,
      isCompleted
    };
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto relative pb-20">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-wider text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage your spending</p>
        </div>

        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 rounded-2xl bg-muted p-1">
            <TabsTrigger value="expenses" className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground">Recent Expenses</TabsTrigger>
            <TabsTrigger value="emi" className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground">EMI Tracker</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="animate-in fade-in duration-500">
            <div className="flex gap-3 mb-6 flex-wrap">
              <div className="flex-1 min-w-[200px] flex items-center gap-2 rounded-full bg-muted px-4 py-2.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input 
                  placeholder="Search expenses..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" 
                />
              </div>
              <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as ExpenseCategory | "All")}>
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
              {filtered.map((exp, i) => {
                const cfg = categoryConfig[exp.category];
                const Icon = cfg.icon;
                return (
                  <div
                    key={exp.id}
                    className="glass-card p-4 flex items-center gap-4 animate-fade-up"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${cfg.color}/20`}>
                      <Icon className={`h-5 w-5 text-foreground opacity-70`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{exp.title}</p>
                      <p className="text-xs text-muted-foreground">{exp.category} · {exp.date}</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">-${exp.amount.toFixed(2)}</p>
                    <div className="flex gap-1">
                      <button className="p-2 rounded-xl hover:bg-muted transition-colors btn-press">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button className="p-2 rounded-xl hover:bg-destructive/20 transition-colors btn-press">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Floating Add Button for Expenses */}
            <button
              onClick={() => setOpen(true)}
              className="fixed bottom-24 right-6 md:bottom-8 md:right-8 h-14 w-14 rounded-full bg-coral text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform btn-press z-50"
            >
              <Plus className="h-6 w-6" />
            </button>
          </TabsContent>

          <TabsContent value="emi" className="animate-in fade-in duration-500">
            <div className="space-y-6">
              {emis.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center glass-card border-dashed">
                  <CreditCard className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">No active EMIs tracked</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Add your loans or installments to track repayment progress</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {emis.map((emi) => {
                    const progress = calculateEMIProgress(emi);
                    return (
                      <div key={emi.id} className={cn("glass-card p-6 animate-fade-up", progress.isCompleted && "opacity-80")}>
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-heading font-bold text-lg text-foreground uppercase tracking-tight">{emi.name}</h3>
                              {progress.isCompleted && (
                                <span className="bg-mint/20 text-mint text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-mint/30">Completed</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Principal: ${emi.principal.toLocaleString()}</span>
                              {emi.interestRate && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{emi.interestRate}% Interest</span>
                              )}
                            </div>
                          </div>
                          {!progress.isCompleted ? (
                            <div className="bg-coral/10 border border-coral/20 rounded-2xl p-4 text-right">
                              <p className="text-[10px] uppercase font-bold text-coral tracking-wider mb-0.5">Next Due Date</p>
                              <p className="text-sm font-bold text-foreground">{format(progress.nextDueDate, "MMM dd, yyyy")}</p>
                              <p className="text-xs font-medium text-coral/80 mt-1">${emi.emiAmount.toFixed(2)}</p>
                            </div>
                          ) : (
                            <div className="bg-mint/10 border border-mint/20 rounded-2xl p-4 text-right flex items-center gap-2">
                              <Zap className="h-4 w-4 text-mint" />
                              <p className="text-xs font-bold text-mint uppercase tracking-wider">Fully Repaid</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-6">
                          <div>
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-muted-foreground font-medium">Time Progress</span>
                              <span className="text-foreground font-bold">{progress.monthsCompleted} / {emi.months} Months</span>
                            </div>
                            <Progress value={progress.monthProgress} className="h-2 bg-muted" indicatorClassName={progress.isCompleted ? "bg-mint" : "bg-coral"} />
                            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                              <span>{progress.monthsCompleted} months completed</span>
                              <span>{progress.monthsPending} months pending</span>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-muted-foreground font-medium">Payment Progress</span>
                              <span className="text-foreground font-bold">${progress.amountPaid.toLocaleString()} / ${progress.totalAmount.toLocaleString()}</span>
                            </div>
                            <Progress value={progress.amountProgress} className="h-2 bg-muted" indicatorClassName="bg-mint" />
                            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                              <span>${progress.amountPaid.toLocaleString()} paid</span>
                              <span>${progress.amountLeft.toLocaleString()} left</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button 
                onClick={() => setEmiOpen(true)}
                className="w-full bg-muted hover:bg-muted/80 text-foreground border border-border/50 h-12 rounded-2xl font-medium"
              >
                <Plus className="mr-2 h-4 w-4" /> Add New EMI
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Expense Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="glass-card border-border" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="font-heading uppercase tracking-wider">Add Expense</DialogTitle>
              <DialogDescription>Enter expense details below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Amount</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allCategories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Source Account</Label>
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
                <Input placeholder="e.g. Lunch with friends" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
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
              <Button onClick={handleAdd} className="w-full bg-coral hover:bg-coral/90 text-white">Add Expense</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add EMI Dialog */}
        <Dialog open={emiOpen} onOpenChange={setEmiOpen}>
          <DialogContent className="glass-card border-border" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="font-heading uppercase tracking-wider">Add EMI Tracker</DialogTitle>
              <DialogDescription>Track your monthly installments.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>EMI Name</Label>
                <Input placeholder="e.g. Home Loan" value={emiName} onChange={(e) => setEmiName(e.target.value)} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Principal Amount</Label>
                  <Input type="number" placeholder="0.00" value={emiPrincipal} onChange={(e) => setEmiPrincipal(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>EMI per Month</Label>
                  <Input type="number" placeholder="0.00" value={emiAmountEachMonth} onChange={(e) => setEmiAmountEachMonth(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tenure (Months)</Label>
                  <Input type="number" placeholder="12" value={emiMonths} onChange={(e) => setEmiMonths(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Interest Rate % (Optional)</Label>
                  <Input type="number" placeholder="0.00" value={emiInterest} onChange={(e) => setEmiInterest(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Start Date</Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal", !emiStartDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {emiStartDate ? format(emiStartDate, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[60]" align="start">
                    <Calendar mode="single" selected={emiStartDate} onSelect={setEmiStartDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <Button onClick={handleAddEMI} className="w-full bg-coral hover:bg-coral/90 text-white">Start Tracking</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Expenses;
