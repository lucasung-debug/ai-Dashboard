import { create } from "zustand";
import type { Currency } from "@/types";
import { getCurrentMonth } from "@/utils/formatters";

interface AppState {
  // Theme
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;

  // Currency
  currency: Currency;
  setCurrency: (currency: Currency) => void;

  // Current month for dashboard
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Theme
  theme: (localStorage.getItem("theme") as "dark" | "light") || "dark",
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("light", theme === "light");
    set({ theme });
  },
  toggleTheme: () => {
    const newTheme = get().theme === "dark" ? "light" : "dark";
    get().setTheme(newTheme);
  },

  // Currency
  currency: (localStorage.getItem("currency") as Currency) || "KRW",
  setCurrency: (currency) => {
    localStorage.setItem("currency", currency);
    set({ currency });
  },

  // Current month
  currentMonth: getCurrentMonth(),
  setCurrentMonth: (month) => set({ currentMonth: month }),
  goToPreviousMonth: () => {
    const current = get().currentMonth;
    const [year, month] = current.split("-").map(Number);
    const prev = month === 1
      ? `${year - 1}-12`
      : `${year}-${String(month - 1).padStart(2, "0")}`;
    set({ currentMonth: prev });
  },
  goToNextMonth: () => {
    const current = get().currentMonth;
    const [year, month] = current.split("-").map(Number);
    const next = month === 12
      ? `${year + 1}-01`
      : `${year}-${String(month + 1).padStart(2, "0")}`;
    set({ currentMonth: next });
  },
  goToCurrentMonth: () => set({ currentMonth: getCurrentMonth() }),

  // Sidebar
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
