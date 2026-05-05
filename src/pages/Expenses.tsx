import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Search, Filter, Trash2, Utensils, Gamepad2, MoreHorizontal, Plus, GraduationCap, Users, Heart, User, CreditCard, Calendar as CalendarIcon, Zap, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { format, differenceInMonths, addMonths, isAfter, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useFinancial } from "@/context/FinancialContext";
import { toast } from "sonner";

const categoryConfig = {
  Education: { icon: GraduationCap, color: "bg-purple" },
  Entertainment: { icon: Gamepad2, color: "bg-violet" },
  Food: { icon: Utensils, color: "bg-coral" },
  Friends: { icon: Users, color: "bg-yellow" },
  Health: { icon: Heart, color: "bg-mint" },
  Investment: { icon: TrendingUp, color: "bg-coral" },
  Personal: { icon: User, color: "bg-soft-blue" },
  Others: { icon: MoreHorizontal, color: "bg-muted" },
} as const;

type ExpenseCategory = keyof typeof categoryConfig;

const allCategories: ExpenseCategory[] = ["Education", "Entertainment", "Food", "Friends", "Health", "Investment", "Personal", "Others"];

const Expenses = () => {
  const { accounts, transactions, budgets, upsertBudget, processTransaction, deleteTransaction, emis, addEMI, deleteEMI, loading } = useFinancial();
  const [open, setOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | "All">("All");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Food");
  const [source, setSource] = useState<"bank" | "wallet">("bank");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());

  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState("");

  const currentMonthBudget = useMemo(() => budgets.find(b => b.category === "Total")?.limit_amount || 0, [budgets]);
  
  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return transactions
      .filter(t => t.type === 'expense' && isWithinInterval(parseISO(t.date), { start, end }))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const [emiOpen, setEmiOpen] = useState(false);
  const [emiName, setEmiName] = useState("");
  const [emiPrincipal, setEmiPrincipal] = useState("");
  const [emiMonths, setEmiMonths] = useState("");
  const [emiAmountEachMonth, setEmiAmountEachMonth] = useState("");
  const [emiInterest, setEmiInterest] = useState("");
  const [emiStartDate, setEmiStartDate] = useState<Date | undefined>(new Date());

  const [searchQuery, setSearchQuery] = useState("");

  const expenses = transactions.filter(t => t.type === 'expense');

  const filtered = (filterCategory === "All" ? expenses : expenses.filter((e) => e.category === filterCategory))
    .filter((e) => 
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleAdd = async () => {
    if (!amount || !date || !source) return;
    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      toast.error("Enter a valid expense amount");
      return;
    }
    
    try {
      await processTransaction({
        type: "expense",
        amount: numAmount,
        source,
        destination: null,
        category,
        description: description || category,
        date: format(date, "yyyy-MM-dd"),
      });

      setOpen(false);
      setAmount("");
      setDescription("");
      setDate(new Date());
    } catch (error) {
      // The context already shows the Supabase error toast.
    }
  };

  const handleUpdateBudget = async () => {
    if (!budgetAmount) return;
    await upsertBudget(parseFloat(budgetAmount));
    setBudgetOpen(false);
    setBudgetAmount("");
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      await deleteTransaction(id);
    }
  };

  const handleAddEMI = async () => {
    if (!emiName || !emiPrincipal || !emiMonths || !emiAmountEachMonth || !emiStartDate) return;
    const principal = parseFloat(emiPrincipal);
    const months = parseInt(emiMonths, 10);
    const emiAmount = parseFloat(emiAmountEachMonth);
    const interestRate = emiInterest ? parseFloat(emiInterest) : undefined;

    if (!Number.isFinite(principal) || !Number.isFinite(months) || !Number.isFinite(emiAmount) || principal <= 0 || months <= 0 || emiAmount <= 0) {
      toast.error("Enter valid EMI details");
      return;
    }

    try {
      await addEMI({
        name: emiName,
        principal,
        months,
        emi_amount: emiAmount,
        interest_rate: interestRate,
        start_date: format(emiStartDate, "yyyy-MM-dd"),
      });
      setEmiOpen(false);
      setEmiName("");
      setEmiPrincipal("");
      setEmiMonths("");
      setEmiAmountEachMonth("");
      setEmiInterest("");
      setEmiStartDate(new Date());
    } catch (error) {
      // The context keeps the form open and surfaces the save failure.
    }
  };

  const calculateEMIProgress = (emi: any) => {
    const now = new Date();
    const startDateObj = typeof emi.start_date === 'string' ? parseISO(emi.start_date) : new Date(emi.start_date);
    const monthsCompleted = Math.max(0, Math.min(emi.months, differenceInMonths(now, startDateObj)));
    const monthsPending = emi.months - monthsCompleted;
    
    const amountPaid = monthsCompleted * emi.emi_amount;
    const totalRepayment = emi.months * emi.emi_amount;
    const amountLeft = totalRepayment - amountPaid;
    
    const nextDueDate = addMonths(startDateObj, monthsCompleted);
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
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-wider text-foreground">Expenses</h1>
            <p className="text-sm text-muted-foreground mt-1">Track and manage your spending</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Monthly Budget</p>
            <p className="text-xl font-heading font-bold text-foreground">₹{currentMonthBudget.toLocaleString()}</p>
            <Button variant="link" size="sm" onClick={() => { setBudgetAmount(currentMonthBudget.toString()); setBudgetOpen(true); }} className="text-coral p-0 h-auto text-xs">Update Budget</Button>
          </div>
        </div>

        <div className="glass-card p-6 mb-8 border-coral/20">
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-medium text-muted-foreground">Budget Progress ({format(new Date(), "MMMM")})</p>
                <p className="text-sm font-bold text-foreground">₹{currentMonthExpenses.toLocaleString()} / ₹{currentMonthBudget.toLocaleString()}</p>
            </div>
            <Progress value={currentMonthBudget > 0 ? (currentMonthExpenses / currentMonthBudget) * 100 : 0} className="h-2 bg-muted" indicatorClassName={currentMonthExpenses > currentMonthBudget ? "bg-destructive" : "bg-coral"} />
            {currentMonthExpenses > currentMonthBudget && (
                <p className="text-[10px] text-destructive mt-2 font-bold uppercase">Budget exceeded by ₹{(currentMonthExpenses - currentMonthBudget).toLocaleString()}!</p>
            )}
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

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((exp, i) => {
                  const cfg = categoryConfig[exp.category as ExpenseCategory] || categoryConfig.Others;
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
                        <p className="text-sm font-medium text-foreground">{exp.description}</p>
                        <p className="text-xs text-muted-foreground">{exp.category} · {format(new Date(exp.date), "PPP")} ({exp.source})</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">-₹{exp.amount.toFixed(2)}</p>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleDelete(exp.id)}
                          className="p-2 rounded-xl hover:bg-destructive/20 transition-colors btn-press"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No expenses found.</p>
                )}
              </div>
            )}

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
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Principal: ₹{emi.principal.toLocaleString()}</span>
                            </div>
                          </div>
                          {!progress.isCompleted ? (
                            <div className="bg-coral/10 border border-coral/20 rounded-2xl p-4 text-right">
                              <p className="text-[10px] uppercase font-bold text-coral tracking-wider mb-0.5">Next Due Date</p>
                              <p className="text-sm font-bold text-foreground">{format(progress.nextDueDate, "MMM dd, yyyy")}</p>
                              <p className="text-xs font-medium text-coral/80 mt-1">₹{Number(emi.emi_amount).toFixed(2)}</p>
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
                            <Progress value={progress.monthProgress} className="h-2 bg-muted" indicatorClassName={progress.isCompleted ? "bg-mint" : "bg-coral"} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <Button onClick={() => setEmiOpen(true)} className="w-full bg-muted hover:bg-muted/80 text-foreground border border-border/50 h-12 rounded-2xl font-medium"><Plus className="mr-2 h-4 w-4" /> Add New EMI</Button>
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
                <Label>Source</Label>
                <Select value={source} onValueChange={(v) => setSource(v as "bank" | "wallet")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank (₹{accounts.find(a => a.id === 'bank')?.balance})</SelectItem>
                    <SelectItem value="wallet">Wallet (₹{accounts.find(a => a.id === 'wallet')?.balance})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Input placeholder="e.g. Lunch" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
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

        {/* Monthly Budget Dialog */}
        <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
          <DialogContent className="glass-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading uppercase tracking-wider">Set Monthly Budget</DialogTitle>
              <DialogDescription>Enter your total spending limit for this month.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Monthly Limit (₹)</Label>
                <Input type="number" placeholder="0.00" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} className="mt-1" />
              </div>
              <Button onClick={handleUpdateBudget} className="w-full bg-coral hover:bg-coral/90 text-white">Save Budget</Button>
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
