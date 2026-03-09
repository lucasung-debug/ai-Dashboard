import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ledgerApi } from "@/services/ledgerApi";
import { useAppStore } from "@/store/useAppStore";
import type { TransactionCreateInput } from "@/types";

export function useTransactions() {
  const currentMonth = useAppStore((s) => s.currentMonth);

  return useQuery({
    queryKey: ["transactions", currentMonth],
    queryFn: () => ledgerApi.getTransactions(currentMonth),
  });
}

export function useAddTransaction() {
  const queryClient = useQueryClient();
  const currentMonth = useAppStore((s) => s.currentMonth);

  return useMutation({
    mutationFn: (input: TransactionCreateInput) => ledgerApi.addTransaction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", currentMonth] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", currentMonth] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const currentMonth = useAppStore((s) => s.currentMonth);

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<TransactionCreateInput> }) =>
      ledgerApi.updateTransaction(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", currentMonth] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", currentMonth] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const currentMonth = useAppStore((s) => s.currentMonth);

  return useMutation({
    mutationFn: (id: number) => ledgerApi.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", currentMonth] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", currentMonth] });
    },
  });
}
