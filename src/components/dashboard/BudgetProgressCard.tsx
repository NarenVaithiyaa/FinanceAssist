const goals = [
  { label: "Monthly Budget", current: 2340, target: 3500, color: "bg-mint" },
  { label: "Savings Goal", current: 1800, target: 5000, color: "bg-violet" },
  { label: "Investment", current: 900, target: 2000, color: "bg-coral" },
];

const BudgetProgressCard = () => {
  return (
    <div className="glass-card card-glow-mint p-6 animate-fade-up-delay-2">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Budget Progress</p>
          <h3 className="text-2xl font-heading font-bold mt-1 text-foreground">67%</h3>
        </div>
        <span className="chip">
          <span className="h-1.5 w-1.5 rounded-full bg-mint" />
          On track
        </span>
      </div>

      <div className="space-y-5">
        {goals.map((goal) => {
          const pct = Math.round((goal.current / goal.target) * 100);
          return (
            <div key={goal.label}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">{goal.label}</span>
                <span className="text-xs font-medium text-foreground">{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${goal.color} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">${goal.current.toLocaleString()}</span>
                <span className="text-[10px] text-muted-foreground">${goal.target.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetProgressCard;
