import { LayoutDashboard, IndianRupee, TrendingUp, PiggyBank, BarChart3, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: IndianRupee, label: "Expenses", path: "/expenses" },
  { icon: TrendingUp, label: "Income", path: "/income" },
  { icon: PiggyBank, label: "Savings", path: "/savings" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[72px] flex-col items-center py-6 z-50 bg-background border-r border-border transition-colors duration-300">
      <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-2xl overflow-hidden">
        <img src="/logo.png" alt="PennyW₹se Logo" className="h-full w-full object-cover" />
      </div>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 btn-press ${
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
              title={label}
            >
              {isActive && (
                <div className="absolute -left-[18px] h-6 w-1 rounded-r-full bg-coral" />
              )}
              <Icon className="h-5 w-5" />
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
