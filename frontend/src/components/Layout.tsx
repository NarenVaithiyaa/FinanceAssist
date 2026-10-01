import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-[72px] pb-24 md:pb-6 px-4 md:px-6 pt-6">
        {children}
      </main>
      <MobileNav />
    </div>
  );
};

export default Layout;
