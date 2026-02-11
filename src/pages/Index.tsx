import Layout from "@/components/Layout";
import BalanceCard from "@/components/dashboard/BalanceCard";
import SpendingTrendCard from "@/components/dashboard/SpendingTrendCard";
import BudgetProgressCard from "@/components/dashboard/BudgetProgressCard";
import CategoryMapCard from "@/components/dashboard/CategoryMapCard";
import AICoachPanel from "@/components/dashboard/AICoachPanel";

const Index = () => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-wider text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Your financial overview at a glance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <BalanceCard />
          <SpendingTrendCard />
          <BudgetProgressCard />
          <CategoryMapCard />
          <AICoachPanel />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
