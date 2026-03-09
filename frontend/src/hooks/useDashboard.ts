import { useQuery } from "@tanstack/react-query";
import { ledgerApi } from "@/services/ledgerApi";
import { useAppStore } from "@/store/useAppStore";

export function useDashboard() {
  const currentMonth = useAppStore((s) => s.currentMonth);
  const currency = useAppStore((s) => s.currency);

  return useQuery({
    queryKey: ["dashboard", currentMonth, currency],
    queryFn: () => ledgerApi.getDashboardSummary(currentMonth, [currency]),
    staleTime: 1000 * 60 * 2,
  });
}
