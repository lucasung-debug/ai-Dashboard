import { Wallet, Bell, Settings, Sun, Moon, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";

export default function Header() {
  const { theme, toggleTheme, setSidebarOpen, sidebarOpen } = useAppStore();

  return (
    <header className="border-b border-border/50 backdrop-blur-md sticky top-0 z-50 bg-background/80">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Wallet className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-xl font-bold tracking-tight">FinPulse</h1>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center ml-2 text-xs font-bold text-primary">
            FP
          </div>
        </div>
      </div>
    </header>
  );
}
