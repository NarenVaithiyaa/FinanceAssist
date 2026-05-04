import { ArrowDownRight, ArrowUpRight, Calendar } from "lucide-react";

const todayExpenses = [
    { title: "Grocery Store", amount: 84.5 },
    { title: "Uber Ride", amount: 24.0 },
];

const todayIncome = [
    { title: "Freelance Payment", amount: 350.0 },
];

const TodaySummaryCard = () => {
    const totalExpense = todayExpenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome = todayIncome.reduce((s, i) => s + i.amount, 0);
    const net = totalIncome - totalExpense;

    const today = new Date();
    const formatted = today.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="glass-card card-glow-yellow p-6 animate-fade-up-delay-3">
            <div className="flex items-start justify-between mb-5">
                <div>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                        Today's Summary
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {formatted}
                    </p>
                </div>
                <span
                    className={`chip ${net >= 0 ? "text-yellow" : "text-coral"
                        }`}
                >
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${net >= 0 ? "bg-yellow" : "bg-coral"
                            }`}
                    />
                    {net >= 0 ? "Positive" : "Negative"}
                </span>
            </div>

            {/* Expense & Income side-by-side */}
            <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="rounded-2xl bg-coral/10 p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                        <ArrowDownRight className="h-4 w-4 text-coral" />
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            Spent
                        </span>
                    </div>
                    <p className="text-xl font-heading font-bold text-coral">
                        ${totalExpense.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        {todayExpenses.length} transaction{todayExpenses.length !== 1 ? "s" : ""}
                    </p>
                </div>

                <div className="rounded-2xl bg-yellow/10 p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                        <ArrowUpRight className="h-4 w-4 text-yellow" />
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            Earned
                        </span>
                    </div>
                    <p className="text-xl font-heading font-bold text-yellow">
                        ${totalIncome.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        {todayIncome.length} transaction{todayIncome.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {/* Net */}
            <div className="border-t border-border/30 pt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Net Today</span>
                <span
                    className={`text-sm font-heading font-bold ${net >= 0 ? "text-yellow" : "text-coral"
                        }`}
                >
                    {net >= 0 ? "+" : "-"}${Math.abs(net).toFixed(2)}
                </span>
            </div>
        </div>
    );
};

export default TodaySummaryCard;
