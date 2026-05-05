import Layout from "@/components/Layout";
import BalanceCard from "@/components/dashboard/BalanceCard";
import SpendingTrendCard from "@/components/dashboard/SpendingTrendCard";
import TodaySummaryCard from "@/components/dashboard/TodaySummaryCard";
import BudgetProgressCard from "@/components/dashboard/BudgetProgressCard";
import CategoryMapCard from "@/components/dashboard/CategoryMapCard";
import AICoachPanel from "@/components/dashboard/AICoachPanel";
import AccountBalances from "@/components/dashboard/AccountBalances";

import { useFinancial } from "@/context/FinancialContext";

const Index = () => {
  const { profile } = useFinancial();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-wider text-foreground">
            Welcome, <span className="text-coral">{profile.name.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Your financial overview at a glance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <BalanceCard />
          <AccountBalances />
          <SpendingTrendCard />
          <TodaySummaryCard />
          <BudgetProgressCard />
          <CategoryMapCard />
          <AICoachPanel />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
