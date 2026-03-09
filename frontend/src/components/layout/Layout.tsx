import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { useIsMobile } from "@/hooks/useMobile";

export default function Layout() {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 pb-20 md:pb-0">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
      {isMobile && <BottomNav />}
    </div>
  );
}
