import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import { Camera, User, Mail, Shield, ChevronLeft, Save, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useFinancial } from "@/context/FinancialContext";
import { useAuth } from "@/context/AuthContext";

const ProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile, setProfile } = useFinancial();
  const { signOut } = useAuth();
  
  const [formData, setFormData] = useState(profile);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
        toast.success("Profile picture updated!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setProfile(formData);
    toast.success("Profile updated successfully!");
    setTimeout(() => navigate("/settings"), 1000);
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto pb-20">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/settings")}
            className="rounded-full hover:bg-muted"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase tracking-wider text-foreground">Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">Customize your personal information</p>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleLogout}
            className="rounded-xl flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="glass-card p-8 space-y-8 animate-fade-up">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-muted cursor-pointer transition-transform group-hover:scale-105">
                <AvatarImage src={formData.avatar} className="object-cover" />
                <AvatarFallback className="bg-coral/20 text-coral text-4xl font-bold">
                  {formData.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-coral text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform btn-press border-4 border-card"
              >
                <Camera className="h-5 w-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-heading font-bold text-foreground">{formData.name}</h2>
              <p className="text-sm text-muted-foreground">{formData.email}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Full Name
              </Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-muted/50 border-none rounded-xl h-12 focus:ring-2 focus:ring-coral"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address
              </Label>
              <Input 
                id="email" 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-muted/50 border-none rounded-xl h-12 focus:ring-2 focus:ring-coral"
                disabled // Email usually comes from Auth and shouldn't be changed here easily
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
              <Textarea 
                id="bio" 
                value={formData.bio} 
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us a bit about yourself..."
                className="bg-muted/50 border-none rounded-2xl min-h-[120px] focus:ring-2 focus:ring-coral resize-none"
              />
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleSave} 
                className="flex-1 bg-coral hover:bg-coral/90 text-white h-12 rounded-xl font-bold uppercase tracking-wider transition-all"
              >
                <Save className="mr-2 h-5 w-5" />
                Save Changes
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/settings")}
                className="flex-1 border-muted hover:bg-muted h-12 rounded-xl font-bold uppercase tracking-wider text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 glass-card bg-soft-blue/5 border-soft-blue/20 flex items-start gap-4">
          <Shield className="h-5 w-5 text-soft-blue mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Secure Storage</p>
            <p className="text-xs text-muted-foreground">Your financial data is securely stored in Supabase with row-level security enabled.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
