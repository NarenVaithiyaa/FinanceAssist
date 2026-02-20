import { useState } from "react";
import Layout from "@/components/Layout";
import { Search, Filter, Pencil, Trash2, ShoppingCart, Utensils, Car, Gamepad2, Zap, MoreHorizontal, Plus, GraduationCap, Users, Heart, User, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

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

const Expenses = () => {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [open, setOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | "All">("All");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Food");
  const [source, setSource] = useState("Bank account");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());

  const filtered = filterCategory === "All" ? expenses : expenses.filter((e) => e.category === filterCategory);

  const handleAdd = () => {
    if (!amount || !date) return;
    const newExp = {
      id: Date.now(),
      title: description || category,
      category,
      amount: parseFloat(amount),
      date: format(date, "PPP"),
      source,
      description,
    };
    setExpenses([newExp, ...expenses]);
    setOpen(false);
    setAmount("");
    setDescription("");
    setDate(new Date());
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto relative pb-20">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-wider text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage your spending</p>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="flex-1 min-w-[200px] flex items-center gap-2 rounded-full bg-muted px-4 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input placeholder="Search expenses..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
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

        {/* Floating Add Button */}
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 h-14 w-14 rounded-full bg-coral text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform btn-press z-50"
        >
          <Plus className="h-6 w-6" />
        </button>

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
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank account">Bank account</SelectItem>
                    <SelectItem value="Wallet">Wallet</SelectItem>
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
      </div>
    </Layout>
  );
};

export default Expenses;
