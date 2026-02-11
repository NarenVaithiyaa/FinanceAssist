import Layout from "@/components/Layout";
import { User, Moon, LogOut, Download } from "lucide-react";

const settingsItems = [
  { icon: User, label: "Profile", description: "Manage your account details", action: "Edit" },
  { icon: Moon, label: "Dark Mode", description: "Always on for this theme", action: "Active" },
  { icon: Download, label: "Install App", description: "Add PennyWise to your home screen", action: "Install" },
  { icon: LogOut, label: "Log Out", description: "Sign out of your account", action: "Sign Out" },
];

const SettingsPage = () => {
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
              <button className="chip hover:bg-muted/80 transition-colors btn-press">
                {item.action}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
