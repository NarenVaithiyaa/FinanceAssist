import Layout from "@/components/Layout";
import { Search, Filter, Pencil, Trash2, ShoppingCart, Utensils, Car, Gamepad2, Zap, MoreHorizontal } from "lucide-react";

const expenses = [
  { id: 1, title: "Grocery Store", category: "Food", amount: 84.50, date: "Today", icon: Utensils, color: "bg-coral" },
  { id: 2, title: "Uber Ride", category: "Transport", amount: 24.00, date: "Today", icon: Car, color: "bg-purple" },
  { id: 3, title: "Netflix", category: "Entertainment", amount: 15.99, date: "Yesterday", icon: Gamepad2, color: "bg-violet" },
  { id: 4, title: "Electric Bill", category: "Bills", amount: 120.00, date: "Yesterday", icon: Zap, color: "bg-yellow" },
  { id: 5, title: "Amazon", category: "Shopping", amount: 67.30, date: "2 days ago", icon: ShoppingCart, color: "bg-soft-blue" },
  { id: 6, title: "Restaurant", category: "Food", amount: 52.80, date: "3 days ago", icon: Utensils, color: "bg-coral" },
];

const Expenses = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-wider text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage your spending</p>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 flex items-center gap-2 rounded-full bg-muted px-4 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input placeholder="Search expenses..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          </div>
          <button className="flex items-center gap-2 rounded-full bg-muted px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors btn-press">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>

        <div className="space-y-3">
          {expenses.map((exp, i) => (
            <div
              key={exp.id}
              className={`glass-card p-4 flex items-center gap-4 animate-fade-up`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${exp.color}/20`}>
                <exp.icon className={`h-5 w-5 text-${exp.color.replace('bg-', '')}`} />
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
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Expenses;
