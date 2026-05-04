import { LayoutDashboard, Receipt, TrendingUp, PiggyBank, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { icon: LayoutDashboard, label: "Home", path: "/" },
  { icon: Receipt, label: "Expenses", path: "/expenses" },
  { icon: TrendingUp, label: "Income", path: "/income" },
  { icon: PiggyBank, label: "Savings", path: "/savings" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const MobileNav = () => {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 flex items-center justify-around rounded-full border border-border bg-card/90 px-2 py-2 backdrop-blur-xl transition-all duration-300"
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}
    >
      {navItems.map(({ icon: Icon, label, path }) => {
        const isActive = location.pathname === path;
        return (
          <NavLink
            key={path}
            to={path}
            className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 transition-all btn-press ${
              isActive
                ? "text-coral"
                : "text-muted-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default MobileNav;
