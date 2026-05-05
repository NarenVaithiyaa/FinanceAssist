import Layout from "@/components/Layout";
import { User, Moon, LogOut, Download, Sun, Landmark } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const settingsItems = [
    { 
      icon: User, 
      label: "Profile", 
      description: "Manage your account details", 
      action: (
        <button 
          onClick={() => navigate("/profile")}
          className="chip hover:bg-muted/80 transition-colors btn-press"
        >
          Edit
        </button>
      ) 
    },
    { 
      icon: theme === "dark" ? Moon : Sun, 
      label: "Dark Mode", 
      description: "Switch between dark and light themes", 
      action: (
        <Switch 
          checked={theme === "dark"} 
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
        />
      ) 
    },
    { 
      icon: Landmark, 
      label: "Bank accounts & wallets", 
      description: "Manage your linked accounts and wallets", 
      action: (
        <button 
          onClick={() => navigate("/accounts")}
          className="chip hover:bg-muted/80 transition-colors btn-press"
        >
          Manage
        </button>
      ) 
    },
    { icon: Download, label: "Install App", description: "Add PennyWise to your home screen", action: <button className="chip hover:bg-muted/80 transition-colors btn-press">Install</button> },
    { 
      icon: LogOut, 
      label: "Log Out", 
      description: "Sign out of your account", 
      action: (
        <button 
          onClick={handleLogout}
          className="chip hover:bg-muted/80 transition-colors btn-press"
        >
          Sign Out
        </button>
      ) 
    },
  ];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-wider text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your preferences</p>
        </div>

        <div className="space-y-3">
          {settingsItems.map((item, i) => (
            <div
              key={item.label}
              className="glass-card p-5 flex items-center gap-4 animate-fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              {item.action}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
