import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/useMobile";

const NAV_ITEMS = [
  { path: "/", label: "대시보드", icon: LayoutDashboard },
  { path: "/transactions", label: "거래 내역", icon: Receipt },
  { path: "/subscriptions", label: "구독/고정비", icon: CreditCard },
  { path: "/settings", label: "설정", icon: Settings },
];

function NavContent() {
  const location = useLocation();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar() {
  const isMobile = useIsMobile();
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  if (isMobile) {
    return (
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
          <div className="pt-6">
            <NavContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="hidden md:block w-56 border-r border-border/50 min-h-[calc(100vh-4rem)]">
      <NavContent />
    </aside>
  );
}
